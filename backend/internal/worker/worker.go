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
	Running          bool      `json:"running"`
	LastRunAt        time.Time `json:"lastRunAt"`
	LastRunPatch     string    `json:"lastRunPatch"`
	MatchesTotal     int       `json:"matchesTotal"`
	MatchesThisRun   int32     `json:"matchesThisRun"` // live counter, updated atomically
	Error            string    `json:"error,omitempty"`
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
	w.mu.Lock()
	if w.status.Running {
		w.mu.Unlock()
		return fmt.Errorf("worker already running")
	}
	w.status.Running = true
	w.status.Error = ""
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

	puuids, err := w.seedPUUIDs(ctx)
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
		matchIDs, err := w.riot.GetMatchIDs(ctx, w.routing, puuid, 0, 20)
		if err != nil {
			w.log.Warn("worker: get match ids", zap.Error(err), zap.String("puuid", puuid[:8]))
			continue
		}
		for _, matchID := range matchIDs {
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
			agg.ingest(match, patch)
			w.markProcessed(ctx, matchID, patch)
			n := atomic.AddInt32(&w.matchesThisRun, 1)
			if n%50 == 0 {
				w.log.Info("worker: progress", zap.Int32("matches", n))
			}
			time.Sleep(60 * time.Millisecond)
		}
	}

	processed := int(atomic.LoadInt32(&w.matchesThisRun))
	w.log.Info("worker: aggregation done", zap.Int("matches", processed))

	if err := w.persist(ctx, agg, patch); err != nil {
		w.setError(fmt.Sprintf("persist: %s", err))
		return fmt.Errorf("persist: %w", err)
	}

	w.cache.Delete(ctx, "meta:top:"+w.region)

	w.mu.Lock()
	w.status.LastRunAt = time.Now()
	w.status.LastRunPatch = patch
	w.status.MatchesTotal += processed
	w.mu.Unlock()

	w.log.Info("worker: update cycle complete", zap.String("patch", patch), zap.Int("processed", processed))
	return nil
}

func (w *Worker) setError(msg string) {
	w.mu.Lock()
	w.status.Error = msg
	w.mu.Unlock()
}

func (w *Worker) seedPUUIDs(ctx context.Context) ([]string, error) {
	league, err := w.riot.GetChallengerPlayers(ctx, w.region)
	if err != nil {
		return nil, err
	}

	limit := 100
	if len(league.Entries) < limit {
		limit = len(league.Entries)
	}

	var puuids []string
	for _, entry := range league.Entries[:limit] {
		// Modern API v4 includes puuid directly — use it and skip the summoner call
		if entry.PUUID != "" {
			puuids = append(puuids, entry.PUUID)
			continue
		}

		// Fallback for older API responses that lack the puuid field
		if entry.SummonerID == "" {
			continue
		}
		summoner, err := w.riot.GetSummonerByID(ctx, w.region, entry.SummonerID)
		if err != nil {
			w.log.Warn("worker: summoner lookup failed", zap.String("id", entry.SummonerID), zap.Error(err))
			continue
		}
		puuids = append(puuids, summoner.PUUID)
		time.Sleep(60 * time.Millisecond)
	}

	w.log.Info("worker: resolved puuids", zap.Int("count", len(puuids)), zap.Int("total_challengers", len(league.Entries)))
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
			data.wins, data.losses, data.games, data.bans, agg.totalGames,
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
	runes      map[int]*winRate
	counters   map[string]*winRate
	skillCasts [4]int
}

type winRate struct{ wins, games int }

type aggregator struct {
	champions  map[string]*champData
	totalGames int
}

func newAggregator() *aggregator {
	return &aggregator{champions: make(map[string]*champData)}
}

func (a *aggregator) getOrCreate(key string) *champData {
	if a.champions[key] == nil {
		a.champions[key] = &champData{
			items:    make(map[int]*winRate),
			spells:   make(map[string]*winRate),
			runes:    make(map[int]*winRate),
			counters: make(map[string]*winRate),
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

		// Runes
		for _, style := range p.Perks.Styles {
			for _, sel := range style.Selections {
				if cd.runes[sel.Perk] == nil {
					cd.runes[sel.Perk] = &winRate{}
				}
				cd.runes[sel.Perk].games++
				if p.Win {
					cd.runes[sel.Perk].wins++
				}
			}
		}

		// Skill casts
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
	type sc struct{ label string; count int }
	skills := []sc{{"Q", cd.skillCasts[0]}, {"W", cd.skillCasts[1]}, {"E", cd.skillCasts[2]}, {"R", cd.skillCasts[3]}}
	sort.Slice(skills, func(i, j int) bool {
		if skills[i].label == "R" { return false }
		if skills[j].label == "R" { return true }
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

// runeEntry is a flat rune record stored in the DB
type runeEntry struct {
	RuneID   int     `json:"runeId"`
	StyleID  int     `json:"styleId"` // path ID (not tracked per-rune here; enriched client-side)
	WinRate  float64 `json:"winRate"`
	PickRate float64 `json:"pickRate"`
	Games    int     `json:"games"`
}

func (cd *champData) toRuneData(patch, role, region string) map[string]interface{} {
	var entries []runeEntry
	for id, wr := range cd.runes {
		if wr.games < minSample {
			continue
		}
		entries = append(entries, runeEntry{
			RuneID:   id,
			WinRate:  float64(wr.wins) / float64(wr.games),
			PickRate: float64(wr.games) / float64(cd.games),
			Games:    wr.games,
		})
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Games > entries[j].Games })

	return map[string]interface{}{
		"patch":      patch,
		"role":       role,
		"region":     region,
		"sampleSize": cd.games,
		"runes":      entries,
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

	if len(beats) > 10 { beats = beats[:10] }
	if len(loses) > 10 { loses = loses[:10] }

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
	case "TOP":                   return "TOP"
	case "JUNGLE":                return "JUNGLE"
	case "MIDDLE", "MID":        return "MIDDLE"
	case "BOTTOM", "BOT", "ADC": return "BOTTOM"
	case "UTILITY", "SUPPORT":   return "UTILITY"
	default:                      return "UNKNOWN"
	}
}

func patchFromVersion(v string) string {
	p := strings.SplitN(v, ".", 3)
	if len(p) >= 2 {
		return p[0] + "." + p[1]
	}
	return v
}
