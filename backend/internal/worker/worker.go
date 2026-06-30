package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"

	"github.com/riftmeta/backend/internal/cache"
	"github.com/riftmeta/backend/internal/db"
	"github.com/riftmeta/backend/internal/models"
	"github.com/riftmeta/backend/internal/riot"
)

// Status describes the current state of the worker
type Status struct {
	Running        bool      `json:"running"`
	LastRunAt      time.Time `json:"lastRunAt"`
	LastRunPatch   string    `json:"lastRunPatch"`
	MatchesTotal   int       `json:"matchesTotal"`
	MatchesThisRun int32     `json:"matchesThisRun"` // live counter, updated atomically
	TargetMatches  int       `json:"targetMatches"`
	Error          string    `json:"error,omitempty"`
}

// RunOptions controls how much match history the worker should collect.
type RunOptions struct {
	TargetMatches    int
	PlayerLimit      int
	MatchesPerPlayer int
}

// Worker collects and aggregates match data in the background
type Worker struct {
	riot    *riot.RiotClient
	db      *db.DB
	cache   *cache.Client
	log     *zap.Logger
	region  string
	routing string

	mu             sync.Mutex
	status         Status
	matchesThisRun int32 // atomic live counter
}

const (
	defaultTargetMatches    = 0
	defaultPlayerLimit      = 100
	defaultMatchesPerPlayer = 20
	maxTargetMatches        = 100000
	maxPlayerLimit          = 5000
	maxMatchesPerPlayer     = 500
	matchIDPageSize         = 100
)

// New creates a Worker
func New(rc *riot.RiotClient, database *db.DB, cacheClient *cache.Client, log *zap.Logger, region, routing string) *Worker {
	return &Worker{
		riot:    rc,
		db:      database,
		cache:   cacheClient,
		log:     log,
		region:  region,
		routing: routing,
	}
}

// GetStatus returns a copy of the current worker status including live match count
func (w *Worker) GetStatus() Status {
	w.mu.Lock()
	s := w.status
	w.mu.Unlock()
	s.MatchesThisRun = atomic.LoadInt32(&w.matchesThisRun)
	return s
}

// IsRunning reports whether the worker is actively collecting
func (w *Worker) IsRunning() bool {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.status.Running
}

// RunOnce performs a full update cycle. Concurrent calls return immediately if already running.
func (w *Worker) RunOnce(ctx context.Context) error {
	return w.RunWithOptions(ctx, RunOptions{})
}

// RunWithOptions performs a full update cycle with bounded collection controls.
func (w *Worker) RunWithOptions(ctx context.Context, opts RunOptions) error {
	opts = normalizeRunOptions(opts)

	w.mu.Lock()
	if w.status.Running {
		w.mu.Unlock()
		return fmt.Errorf("worker already running")
	}
	w.status.Running = true
	w.status.Error = ""
	w.status.TargetMatches = opts.TargetMatches
	atomic.StoreInt32(&w.matchesThisRun, 0)
	w.mu.Unlock()

	defer func() {
		w.mu.Lock()
		w.status.Running = false
		w.mu.Unlock()
	}()

	w.log.Info("worker: starting update cycle")

	version, err := w.riot.GetLatestVersion(ctx)
	if err != nil {
		w.setError(fmt.Sprintf("get version: %s", err))
		return fmt.Errorf("get version: %w", err)
	}
	patch := patchFromVersion(version)

	puuids, err := w.seedPUUIDs(ctx, opts.PlayerLimit)
	if err != nil {
		msg := fmt.Sprintf("seed puuids failed: %s", err)
		w.log.Warn("worker: " + msg)
		w.setError(msg)
		return fmt.Errorf("%s", msg)
	}
	w.log.Info("worker: seeded puuids", zap.Int("count", len(puuids)))

	agg := newAggregator()

	for _, puuid := range puuids {
		if ctx.Err() != nil {
			break
		}
		if opts.TargetMatches > 0 && int(atomic.LoadInt32(&w.matchesThisRun)) >= opts.TargetMatches {
			break
		}

		for start := 0; start < opts.MatchesPerPlayer; start += matchIDPageSize {
			count := matchIDPageSize
			if remaining := opts.MatchesPerPlayer - start; remaining < count {
				count = remaining
			}

			matchIDs, err := w.riot.GetMatchIDs(ctx, w.routing, puuid, start, count)
			if err != nil {
				w.log.Warn("worker: get match ids", zap.Error(err), zap.String("puuid", safePrefix(puuid, 8)), zap.Int("start", start))
				continue
			}
			if len(matchIDs) == 0 {
				break
			}

			for _, matchID := range matchIDs {
				if opts.TargetMatches > 0 && int(atomic.LoadInt32(&w.matchesThisRun)) >= opts.TargetMatches {
					break
				}
				if w.alreadyProcessed(ctx, matchID) {
					continue
				}
				match, err := w.riot.GetMatch(ctx, w.routing, matchID)
				if err != nil {
					w.log.Warn("worker: get match", zap.Error(err), zap.String("id", matchID))
					continue
				}
				if match.Info.QueueID != 420 {
					continue
				}
				before := agg.totalGames
				agg.ingest(match, patch)
				if agg.totalGames == before {
					continue
				}
				w.markProcessed(ctx, matchID, patch)
				n := atomic.AddInt32(&w.matchesThisRun, 1)
				if n%50 == 0 {
					w.log.Info("worker: progress", zap.Int32("matches", n), zap.Int("target", opts.TargetMatches))
				}
				time.Sleep(60 * time.Millisecond)
			}
		}
	}

	processed := int(atomic.LoadInt32(&w.matchesThisRun))
	w.log.Info("worker: aggregation done", zap.Int("matches", processed))

	if err := w.persist(ctx, agg, patch); err != nil {
		w.setError(fmt.Sprintf("persist: %s", err))
		return fmt.Errorf("persist: %w", err)
	}

	w.bustMetaCaches(ctx)

	w.mu.Lock()
	w.status.LastRunAt = time.Now()
	w.status.LastRunPatch = patch
	w.status.MatchesTotal += processed
	w.status.TargetMatches = 0
	w.mu.Unlock()

	w.log.Info("worker: update cycle complete", zap.String("patch", patch), zap.Int("processed", processed))
	return nil
}

func normalizeRunOptions(opts RunOptions) RunOptions {
	if opts.TargetMatches < 0 {
		opts.TargetMatches = defaultTargetMatches
	}
	if opts.TargetMatches > maxTargetMatches {
		opts.TargetMatches = maxTargetMatches
	}
	if opts.PlayerLimit <= 0 {
		opts.PlayerLimit = defaultPlayerLimit
	}
	if opts.PlayerLimit > maxPlayerLimit {
		opts.PlayerLimit = maxPlayerLimit
	}
	if opts.MatchesPerPlayer <= 0 {
		opts.MatchesPerPlayer = defaultMatchesPerPlayer
	}
	if opts.MatchesPerPlayer > maxMatchesPerPlayer {
		opts.MatchesPerPlayer = maxMatchesPerPlayer
	}
	return opts
}

func (w *Worker) setError(msg string) {
	w.mu.Lock()
	w.status.Error = msg
	w.mu.Unlock()
}

func (w *Worker) seedPUUIDs(ctx context.Context, limit int) ([]string, error) {
	var puuids []string
	seen := make(map[string]bool)
	totalEntries := 0

	for _, tier := range []string{"challenger", "grandmaster", "master"} {
		if len(puuids) >= limit {
			break
		}
		league, err := w.riot.GetLeaguePlayers(ctx, w.region, tier)
		if err != nil {
			if len(puuids) == 0 {
				return nil, err
			}
			w.log.Warn("worker: league seed failed", zap.String("tier", tier), zap.Error(err))
			continue
		}
		totalEntries += len(league.Entries)

		sort.SliceStable(league.Entries, func(i, j int) bool {
			return league.Entries[i].LeaguePoints > league.Entries[j].LeaguePoints
		})

		for _, entry := range league.Entries {
			if len(puuids) >= limit {
				break
			}

			puuid := entry.PUUID
			if puuid == "" && entry.SummonerID != "" {
				summoner, err := w.riot.GetSummonerByID(ctx, w.region, entry.SummonerID)
				if err != nil {
					w.log.Warn("worker: summoner lookup failed", zap.String("id", entry.SummonerID), zap.Error(err))
					continue
				}
				puuid = summoner.PUUID
				time.Sleep(60 * time.Millisecond)
			}
			if puuid == "" || seen[puuid] {
				continue
			}
			seen[puuid] = true
			puuids = append(puuids, puuid)
		}
	}

	w.log.Info("worker: resolved puuids", zap.Int("count", len(puuids)), zap.Int("limit", limit), zap.Int("total_entries", totalEntries))
	return puuids, nil
}

func (w *Worker) alreadyProcessed(ctx context.Context, matchID string) bool {
	var processed bool
	err := w.db.Pool.QueryRow(ctx,
		`SELECT processed FROM processed_matches WHERE match_id = $1`, matchID,
	).Scan(&processed)
	return err == nil && processed
}

func (w *Worker) markProcessed(ctx context.Context, matchID, patch string) {
	w.db.Pool.Exec(ctx,
		`INSERT INTO processed_matches (match_id, region, patch, processed, processed_at)
		 VALUES ($1, $2, $3, true, NOW())
		 ON CONFLICT (match_id) DO UPDATE SET processed = true, processed_at = NOW()`,
		matchID, w.region, patch,
	)
}

func (w *Worker) bustMetaCaches(ctx context.Context) {
	w.cache.Delete(ctx, "meta:top:"+w.region)
	for _, role := range []string{"", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"} {
		w.cache.Delete(ctx, fmt.Sprintf("meta:top:%s:%s", w.region, role))
	}
}

func safePrefix(s string, n int) string {
	if len(s) < n {
		return s
	}
	return s[:n]
}

// persist saves all aggregated champion data to PostgreSQL
func (w *Worker) persist(ctx context.Context, agg *aggregator, patch string) error {
	for key, data := range agg.champions {
		parts := strings.SplitN(key, ":", 2)
		if len(parts) != 2 {
			continue
		}
		championID, role := parts[0], parts[1]

		// ---- stats ----
		if _, err := w.db.Pool.Exec(ctx, `
			INSERT INTO champion_stats
				(champion_id, patch, role, region, wins, losses, games, bans, total_games, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
			ON CONFLICT (champion_id, patch, role, region) DO UPDATE SET
				wins=EXCLUDED.wins, losses=EXCLUDED.losses, games=EXCLUDED.games,
				bans=EXCLUDED.bans, total_games=EXCLUDED.total_games, updated_at=NOW()`,
			championID, patch, role, w.region,
			data.wins, data.losses, data.games, agg.banCounts[championID], agg.totalGames,
		); err != nil {
			w.log.Warn("persist stats", zap.String("champ", championID), zap.Error(err))
		}

		// ---- builds ----
		buildJSON, _ := json.Marshal(data.toBuildData(patch, role, w.region))
		w.db.Pool.Exec(ctx, `
			INSERT INTO champion_builds
				(champion_id, patch, role, region, build_data, sample_size, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,NOW())
			ON CONFLICT (champion_id, patch, role, region) DO UPDATE SET
				build_data=EXCLUDED.build_data, sample_size=EXCLUDED.sample_size, updated_at=NOW()`,
			championID, patch, role, w.region, buildJSON, data.games,
		)

		// ---- runes ----
		runeJSON, _ := json.Marshal(data.toRuneData(patch, role, w.region))
		w.db.Pool.Exec(ctx, `
			INSERT INTO champion_runes
				(champion_id, patch, role, region, rune_data, sample_size, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,NOW())
			ON CONFLICT (champion_id, patch, role, region) DO UPDATE SET
				rune_data=EXCLUDED.rune_data, sample_size=EXCLUDED.sample_size, updated_at=NOW()`,
			championID, patch, role, w.region, runeJSON, data.games,
		)

		// ---- counters ----
		counterJSON, _ := json.Marshal(data.toCounterData(championID, patch, role, w.region))
		w.db.Pool.Exec(ctx, `
			INSERT INTO champion_counters
				(champion_id, patch, role, region, counter_data, sample_size, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,NOW())
			ON CONFLICT (champion_id, patch, role, region) DO UPDATE SET
				counter_data=EXCLUDED.counter_data, sample_size=EXCLUDED.sample_size, updated_at=NOW()`,
			championID, patch, role, w.region, counterJSON, data.games,
		)

		// bust all caches for this champion
		for _, suffix := range []string{"stats", "builds", "runes", "counters"} {
			w.cache.Delete(ctx, fmt.Sprintf("champion:%s:%s:%s:%s:%s", suffix, championID, patch, role, w.region))
		}
	}
	return nil
}

// ---- Aggregation types ----

type champData struct {
	wins       int
	losses     int
	games      int
	bans       int
	items      map[int]*winRate
	spells     map[string]*winRate
	counters   map[string]*winRate
	skillCasts [4]int
	// Rune tracking (split by primary/secondary path)
	primaryPaths   map[int]*winRate         // pathID → {wins, games}
	secondaryPaths map[int]*winRate         // pathID → {wins, games}
	primaryRunes   map[int]map[int]*winRate // primaryPathID → runeID → {wins, games}
	secondaryRunes map[int]map[int]*winRate // secondaryPathID → runeID → {wins, games}
	shards         [3]map[int]int           // slot[0,1,2] → shardID → count
}

type winRate struct{ wins, games int }

type aggregator struct {
	champions  map[string]*champData
	totalGames int
	banCounts  map[string]int // championName → times banned
}

func newAggregator() *aggregator {
	return &aggregator{
		champions: make(map[string]*champData),
		banCounts: make(map[string]int),
	}
}

func (a *aggregator) getOrCreate(key string) *champData {
	if a.champions[key] == nil {
		a.champions[key] = &champData{
			items:          make(map[int]*winRate),
			spells:         make(map[string]*winRate),
			counters:       make(map[string]*winRate),
			primaryPaths:   make(map[int]*winRate),
			secondaryPaths: make(map[int]*winRate),
			primaryRunes:   make(map[int]map[int]*winRate),
			secondaryRunes: make(map[int]map[int]*winRate),
			shards:         [3]map[int]int{make(map[int]int), make(map[int]int), make(map[int]int)},
		}
	}
	return a.champions[key]
}

func (a *aggregator) ingest(match *riot.MatchDTO, patch string) {
	// Only count matches from the current patch
	if !strings.HasPrefix(match.Info.GameVersion, patch) {
		return
	}
	a.totalGames++

	// Build championID → name map for ban lookup
	champIDToName := make(map[int]string, len(match.Info.Participants))
	for _, p := range match.Info.Participants {
		champIDToName[p.ChampionID] = p.ChampionName
	}

	// Count bans (ChampionID -1 means no ban in that slot)
	for _, team := range match.Info.Teams {
		for _, ban := range team.Bans {
			if ban.ChampionID <= 0 {
				continue
			}
			if name, ok := champIDToName[ban.ChampionID]; ok && name != "" {
				a.banCounts[name]++
			}
		}
	}

	for _, p := range match.Info.Participants {
		role := normalizeRole(p.IndividualPosition)
		cd := a.getOrCreate(p.ChampionName + ":" + role)

		if p.Win {
			cd.wins++
		} else {
			cd.losses++
		}
		cd.games++

		// Items (slots 0-5; slot 6 is trinket)
		for _, itemID := range []int{p.Item0, p.Item1, p.Item2, p.Item3, p.Item4, p.Item5} {
			if itemID == 0 {
				continue
			}
			wr := cd.items[itemID]
			if wr == nil {
				wr = &winRate{}
				cd.items[itemID] = wr
			}
			wr.games++
			if p.Win {
				wr.wins++
			}
		}

		// Summoner spells
		spellKey := strconv.Itoa(p.SummonerSpell1ID) + "|" + strconv.Itoa(p.SummonerSpell2ID)
		if cd.spells[spellKey] == nil {
			cd.spells[spellKey] = &winRate{}
		}
		cd.spells[spellKey].games++
		if p.Win {
			cd.spells[spellKey].wins++
		}

		// Runes — track by path so we can reconstruct primary/secondary correctly
		if len(p.Perks.Styles) >= 1 {
			pri := p.Perks.Styles[0]
			pid := pri.Style
			if cd.primaryPaths[pid] == nil {
				cd.primaryPaths[pid] = &winRate{}
			}
			cd.primaryPaths[pid].games++
			if p.Win {
				cd.primaryPaths[pid].wins++
			}
			if cd.primaryRunes[pid] == nil {
				cd.primaryRunes[pid] = make(map[int]*winRate)
			}
			for _, sel := range pri.Selections {
				if cd.primaryRunes[pid][sel.Perk] == nil {
					cd.primaryRunes[pid][sel.Perk] = &winRate{}
				}
				cd.primaryRunes[pid][sel.Perk].games++
				if p.Win {
					cd.primaryRunes[pid][sel.Perk].wins++
				}
			}
		}
		if len(p.Perks.Styles) >= 2 {
			sec := p.Perks.Styles[1]
			sid := sec.Style
			if cd.secondaryPaths[sid] == nil {
				cd.secondaryPaths[sid] = &winRate{}
			}
			cd.secondaryPaths[sid].games++
			if cd.secondaryRunes[sid] == nil {
				cd.secondaryRunes[sid] = make(map[int]*winRate)
			}
			for _, sel := range sec.Selections {
				if cd.secondaryRunes[sid][sel.Perk] == nil {
					cd.secondaryRunes[sid][sel.Perk] = &winRate{}
				}
				cd.secondaryRunes[sid][sel.Perk].games++
				if p.Win {
					cd.secondaryRunes[sid][sel.Perk].wins++
				}
			}
		}

		// Stat shards
		cd.shards[0][p.Perks.StatPerks.Offense]++
		cd.shards[1][p.Perks.StatPerks.Flex]++
		cd.shards[2][p.Perks.StatPerks.Defense]++

		// Skill casts (spell1Casts=Q, spell2Casts=W, spell3Casts=E, spell4Casts=R)
		for i, v := range [4]int{p.Skill1Casts, p.Skill2Casts, p.Skill3Casts, p.Skill4Casts} {
			cd.skillCasts[i] += v
		}
	}

	// Counter matchups: opposite-team, same-role pairs
	byRole := make(map[string][2]riot.Participant)
	for _, p := range match.Info.Participants {
		role := normalizeRole(p.IndividualPosition)
		entry := byRole[role]
		if entry[0].ChampionName == "" {
			entry[0] = p
		} else if entry[0].TeamID != p.TeamID {
			entry[1] = p
		}
		byRole[role] = entry
	}
	for _, pair := range byRole {
		p1, p2 := pair[0], pair[1]
		if p1.ChampionName == "" || p2.ChampionName == "" || p1.TeamID == p2.TeamID {
			continue
		}
		role := normalizeRole(p1.IndividualPosition)
		cd1 := a.getOrCreate(p1.ChampionName + ":" + role)
		cd2 := a.getOrCreate(p2.ChampionName + ":" + role)

		if cd1.counters[p2.ChampionName] == nil {
			cd1.counters[p2.ChampionName] = &winRate{}
		}
		if cd2.counters[p1.ChampionName] == nil {
			cd2.counters[p1.ChampionName] = &winRate{}
		}
		cd1.counters[p2.ChampionName].games++
		cd2.counters[p1.ChampionName].games++
		if p1.Win {
			cd1.counters[p2.ChampionName].wins++
		} else {
			cd2.counters[p1.ChampionName].wins++
		}
	}
}

// ---- Data conversion helpers ----

const minSample = 20

func (cd *champData) toBuildData(patch, role, region string) models.ChampionBuild {
	var items []models.ItemBuild
	for id, wr := range cd.items {
		if wr.games < minSample {
			continue
		}
		items = append(items, models.ItemBuild{
			ItemID:   strconv.Itoa(id),
			PickRate: float64(wr.games) / float64(cd.games),
			WinRate:  float64(wr.wins) / float64(wr.games),
			Games:    wr.games,
		})
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Games > items[j].Games })
	if len(items) > 10 {
		items = items[:10]
	}

	var spells []models.SummonerSpellBuild
	for combo, wr := range cd.spells {
		if wr.games < minSample {
			continue
		}
		p := strings.SplitN(combo, "|", 2)
		if len(p) != 2 {
			continue
		}
		spells = append(spells, models.SummonerSpellBuild{
			Spell1:   models.SummonerSpell{ID: p[0]},
			Spell2:   models.SummonerSpell{ID: p[1]},
			WinRate:  float64(wr.wins) / float64(wr.games),
			PickRate: float64(wr.games) / float64(cd.games),
			Games:    wr.games,
		})
	}
	sort.Slice(spells, func(i, j int) bool { return spells[i].Games > spells[j].Games })
	if len(spells) > 3 {
		spells = spells[:3]
	}

	// Infer skill max order from cast frequency (R always last)
	type sc struct {
		label string
		count int
	}
	skills := []sc{{"Q", cd.skillCasts[0]}, {"W", cd.skillCasts[1]}, {"E", cd.skillCasts[2]}, {"R", cd.skillCasts[3]}}
	sort.Slice(skills, func(i, j int) bool {
		if skills[i].label == "R" {
			return false
		}
		if skills[j].label == "R" {
			return true
		}
		return skills[i].count > skills[j].count
	})
	maxOrder := make([]string, len(skills))
	for i, s := range skills {
		maxOrder[i] = s.label
	}

	return models.ChampionBuild{
		Patch:          patch,
		Role:           role,
		Region:         region,
		CoreItems:      items,
		SummonerSpells: spells,
		SkillOrder:     models.SkillOrder{MaxOrder: maxOrder},
		SampleSize:     cd.games,
	}
}

// storedRuneData is the format saved to champion_runes in the DB.
// The handler enriches it with Data Dragon path/rune metadata before returning to the client.
type storedRuneData struct {
	Patch            string  `json:"patch"`
	Role             string  `json:"role"`
	Region           string  `json:"region"`
	SampleSize       int     `json:"sampleSize"`
	PrimaryPathID    int     `json:"primaryPathId"`
	SecondaryPathID  int     `json:"secondaryPathId"`
	PrimaryRuneIDs   []int   `json:"primaryRuneIds"`
	SecondaryRuneIDs []int   `json:"secondaryRuneIds"`
	ShardIDs         []int   `json:"shardIds"`
	WinRate          float64 `json:"winRate"`
	Games            int     `json:"games"`
}

func (cd *champData) toRuneData(patch, role, region string) storedRuneData {
	type idGames struct{ id, games int }

	// Most popular primary path
	var bestPrimPathID, bestPrimGames int
	var totalWins, totalGames int
	for pid, wr := range cd.primaryPaths {
		totalWins += wr.wins
		totalGames += wr.games
		if wr.games > bestPrimGames {
			bestPrimGames = wr.games
			bestPrimPathID = pid
		}
	}

	// Most popular secondary path
	var bestSecPathID, bestSecGames int
	for pid, wr := range cd.secondaryPaths {
		if wr.games > bestSecGames {
			bestSecGames = wr.games
			bestSecPathID = pid
		}
	}

	// Top 4 primary rune IDs (by games) for the best primary path
	var primRunes []idGames
	for id, wr := range cd.primaryRunes[bestPrimPathID] {
		primRunes = append(primRunes, idGames{id, wr.games})
	}
	sort.Slice(primRunes, func(i, j int) bool { return primRunes[i].games > primRunes[j].games })
	if len(primRunes) > 4 {
		primRunes = primRunes[:4]
	}
	primaryRuneIDs := make([]int, len(primRunes))
	for i, e := range primRunes {
		primaryRuneIDs[i] = e.id
	}

	// Top 2 secondary rune IDs for the best secondary path
	var secRunes []idGames
	for id, wr := range cd.secondaryRunes[bestSecPathID] {
		secRunes = append(secRunes, idGames{id, wr.games})
	}
	sort.Slice(secRunes, func(i, j int) bool { return secRunes[i].games > secRunes[j].games })
	if len(secRunes) > 2 {
		secRunes = secRunes[:2]
	}
	secondaryRuneIDs := make([]int, len(secRunes))
	for i, e := range secRunes {
		secondaryRuneIDs[i] = e.id
	}

	// Most popular shard per slot
	shardIDs := make([]int, 3)
	for slot := 0; slot < 3; slot++ {
		var bestID, bestCount int
		for id, count := range cd.shards[slot] {
			if count > bestCount {
				bestCount = count
				bestID = id
			}
		}
		shardIDs[slot] = bestID
	}

	var winRate float64
	if totalGames > 0 {
		winRate = float64(totalWins) / float64(totalGames)
	}

	return storedRuneData{
		Patch:            patch,
		Role:             role,
		Region:           region,
		SampleSize:       cd.games,
		PrimaryPathID:    bestPrimPathID,
		SecondaryPathID:  bestSecPathID,
		PrimaryRuneIDs:   primaryRuneIDs,
		SecondaryRuneIDs: secondaryRuneIDs,
		ShardIDs:         shardIDs,
		WinRate:          winRate,
		Games:            totalGames,
	}
}

func (cd *champData) toCounterData(championID, patch, role, region string) models.ChampionCounters {
	var beats, loses []models.Counter
	for opponentName, wr := range cd.counters {
		if wr.games < minSample {
			continue
		}
		ours := float64(wr.wins) / float64(wr.games)
		c := models.Counter{
			ChampionID: opponentName,
			WinRate:    ours,
			Games:      wr.games,
		}
		if ours >= 0.5 {
			beats = append(beats, c)
		} else {
			loses = append(loses, c)
		}
	}

	// Best counters for us = highest win rate; worst = lowest
	sort.Slice(beats, func(i, j int) bool { return beats[i].WinRate > beats[j].WinRate })
	sort.Slice(loses, func(i, j int) bool { return loses[i].WinRate < loses[j].WinRate })

	if len(beats) > 10 {
		beats = beats[:10]
	}
	if len(loses) > 10 {
		loses = loses[:10]
	}

	return models.ChampionCounters{
		ChampionID:      championID,
		Patch:           patch,
		Role:            role,
		Region:          region,
		CountersWith:    beats,
		CountersAgainst: loses,
		SampleSize:      cd.games,
	}
}

// ---- Helpers ----

func normalizeRole(pos string) string {
	switch strings.ToUpper(pos) {
	case "TOP":
		return "TOP"
	case "JUNGLE":
		return "JUNGLE"
	case "MIDDLE", "MID":
		return "MIDDLE"
	case "BOTTOM", "BOT", "ADC":
		return "BOTTOM"
	case "UTILITY", "SUPPORT":
		return "UTILITY"
	default:
		return "UNKNOWN"
	}
}

func patchFromVersion(v string) string {
	p := strings.SplitN(v, ".", 3)
	if len(p) >= 2 {
		return p[0] + "." + p[1]
	}
	return v
}
