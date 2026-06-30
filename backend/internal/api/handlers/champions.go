package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/riftmeta/backend/internal/cache"
	"github.com/riftmeta/backend/internal/db"
	"github.com/riftmeta/backend/internal/models"
	"github.com/riftmeta/backend/internal/riot"
	"github.com/riftmeta/backend/internal/worker"
)

// Handler holds shared dependencies for all route handlers
type Handler struct {
	riotClient *riot.RiotClient
	cache      *cache.Client
	db         *db.DB
	worker     *worker.Worker
	region     string
	routing    string
}

// New creates a new Handler with all dependencies injected
func New(rc *riot.RiotClient, c *cache.Client, database *db.DB, w *worker.Worker, region, routing string) *Handler {
	return &Handler{
		riotClient: rc,
		cache:      c,
		db:         database,
		worker:     w,
		region:     region,
		routing:    routing,
	}
}

// GetWorkerStatus returns the background worker's current status
func (h *Handler) GetWorkerStatus(c *fiber.Ctx) error {
	return c.JSON(h.worker.GetStatus())
}

// PingRiotAPI makes a cheap Riot API call to verify the key works
func (h *Handler) PingRiotAPI(c *fiber.Ctx) error {
	ctx := c.Context()

	// Fetching the version list requires no auth — proves network is fine
	version, err := h.riotClient.GetLatestVersion(ctx)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"ok":    false,
			"stage": "data_dragon",
			"error": err.Error(),
		})
	}

	// Fetching challenger list requires the API key
	region := c.Query("region", h.region)
	league, err := h.riotClient.GetChallengerPlayers(ctx, region)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"ok":      false,
			"stage":   "riot_api_key",
			"version": version,
			"region":  region,
			"error":   err.Error(),
			"hint":    "Check RIOT_API_KEY in your .env — personal keys expire every 24 hours",
		})
	}

	return c.JSON(fiber.Map{
		"ok":           true,
		"version":      version,
		"region":       region,
		"challengers":  len(league.Entries),
	})
}

// TriggerWorker starts a worker run in the background if not already running.
// Pass ?reset=true to clear processed match history so all matches are re-fetched.
func (h *Handler) TriggerWorker(c *fiber.Ctx) error {
	if h.worker.IsRunning() {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "worker already running",
		})
	}

	if c.Query("reset") == "true" {
		if _, err := h.db.Pool.Exec(c.Context(), `DELETE FROM processed_matches`); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "reset failed: " + err.Error()})
		}
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		h.worker.RunOnce(ctx) //nolint:errcheck
	}()

	return c.JSON(fiber.Map{"message": "worker started"})
}

// GetVersion returns the current Data Dragon version
func (h *Handler) GetVersion(c *fiber.Ctx) error {
	ctx := c.Context()

	var version string
	if err := h.cache.Get(ctx, "dd:version", &version); err == nil {
		return c.JSON(fiber.Map{"version": version})
	}

	v, err := h.riotClient.GetLatestVersion(context.Background())
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "could not fetch version"})
	}

	h.cache.Set(ctx, "dd:version", v, cache.TTLVersion)
	return c.JSON(fiber.Map{"version": v})
}

// ListChampions returns all champions with static Data Dragon data
func (h *Handler) ListChampions(c *fiber.Ctx) error {
	ctx := c.Context()

	var champions []models.Champion
	if err := h.cache.Get(ctx, "champions:all", &champions); err == nil {
		return c.JSON(champions)
	}

	version, err := h.getVersion(ctx)
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "version unavailable"})
	}

	raw, err := h.riotClient.GetAllChampions(ctx, version)
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Data Dragon unavailable"})
	}

	for _, dd := range raw {
		champions = append(champions, ddToChampion(dd, version))
	}

	h.cache.Set(ctx, "champions:all", champions, cache.TTLChampions)
	return c.JSON(champions)
}

// GetChampion returns a single champion's static data
func (h *Handler) GetChampion(c *fiber.Ctx) error {
	ctx := c.Context()
	id := c.Params("id")

	cacheKey := fmt.Sprintf("champions:detail:%s", id)
	var champ models.Champion
	if err := h.cache.Get(ctx, cacheKey, &champ); err == nil {
		return c.JSON(champ)
	}

	version, err := h.getVersion(ctx)
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "version unavailable"})
	}

	raw, err := h.riotClient.GetAllChampions(ctx, version)
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Data Dragon unavailable"})
	}

	dd, ok := raw[id]
	if !ok {
		// Try case-insensitive match
		for k, v := range raw {
			if strings.EqualFold(k, id) {
				dd = v
				ok = true
				break
			}
		}
		if !ok {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "champion not found"})
		}
	}

	champ = ddToChampion(dd, version)
	h.cache.Set(ctx, cacheKey, champ, cache.TTLChampions)
	return c.JSON(champ)
}

// GetChampionStats returns win/pick/ban rates for a champion
func (h *Handler) GetChampionStats(c *fiber.Ctx) error {
	ctx := c.Context()
	id := c.Params("id")
	role := c.Query("role", "")
	patch := c.Query("patch", "")
	region := c.Query("region", h.region)

	if patch == "" {
		if v, err := h.getVersion(ctx); err == nil {
			patch = patchFromVersion(v)
		}
	}

	cacheKey := fmt.Sprintf("champion:stats:%s:%s:%s:%s", id, patch, role, region)
	var stats models.ChampionStats
	if err := h.cache.Get(ctx, cacheKey, &stats); err == nil {
		return c.JSON(stats)
	}

	query := `
		SELECT wins, losses, games, bans, total_games
		FROM champion_stats
		WHERE champion_id = $1 AND patch = $2 AND region = $3`
	args := []any{id, patch, region}

	if role != "" {
		query += " AND role = $4"
		args = append(args, role)
	} else {
		// Aggregate across all roles
		query = `
			SELECT SUM(wins), SUM(losses), SUM(games), SUM(bans), MAX(total_games)
			FROM champion_stats
			WHERE champion_id = $1 AND patch = $2 AND region = $3`
	}

	var wins, losses, games, bans, totalGames int
	err := h.db.Pool.QueryRow(ctx, query, args...).Scan(&wins, &losses, &games, &bans, &totalGames)
	if err != nil || games == 0 {
		return c.JSON(models.ChampionStats{
			ChampionID: id,
			Patch:      patch,
			Role:       role,
			Region:     region,
		})
	}

	stats = models.ChampionStats{
		ChampionID: id,
		Patch:      patch,
		Role:       role,
		Region:     region,
		Wins:       wins,
		Losses:     losses,
		Games:      games,
		SampleSize: games,
	}
	if games > 0 {
		stats.WinRate = float64(wins) / float64(games)
	}
	if totalGames > 0 {
		stats.PickRate = float64(games) / float64(totalGames)
		stats.BanRate = float64(bans) / float64(totalGames)
	}

	h.cache.Set(ctx, cacheKey, stats, cache.TTLStats)
	return c.JSON(stats)
}

// GetChampionBuilds returns aggregated build data for a champion
func (h *Handler) GetChampionBuilds(c *fiber.Ctx) error {
	ctx := c.Context()
	id := c.Params("id")
	role := c.Query("role", "")
	patch := c.Query("patch", "")
	region := c.Query("region", h.region)

	if patch == "" {
		if v, err := h.getVersion(ctx); err == nil {
			patch = patchFromVersion(v)
		}
	}

	cacheKey := fmt.Sprintf("champion:builds:%s:%s:%s:%s", id, patch, role, region)
	var build models.ChampionBuild
	if err := h.cache.Get(ctx, cacheKey, &build); err == nil {
		return c.JSON(build)
	}

	query := `SELECT build_data FROM champion_builds WHERE champion_id = $1 AND patch = $2 AND region = $3`
	args := []any{id, patch, region}
	if role != "" {
		query += " AND role = $4 ORDER BY sample_size DESC LIMIT 1"
		args = append(args, role)
	} else {
		query += " ORDER BY sample_size DESC LIMIT 1"
	}

	var buildJSON []byte
	err := h.db.Pool.QueryRow(ctx, query, args...).Scan(&buildJSON)
	if err != nil || len(buildJSON) == 0 {
		// Enrich with static item data from Data Dragon
		version, _ := h.getVersion(ctx)
		build = models.ChampionBuild{
			ChampionID: id,
			Patch:      patch,
			Role:       role,
			Region:     region,
		}
		_ = version
		return c.JSON(build)
	}

	if err := json.Unmarshal(buildJSON, &build); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid build data"})
	}

	// Enrich items with Data Dragon metadata
	version, err := h.getVersion(ctx)
	if err == nil {
		build = h.enrichBuildItems(ctx, build, version)
	}

	h.cache.Set(ctx, cacheKey, build, cache.TTLBuilds)
	return c.JSON(build)
}

// storedRuneData mirrors the struct saved by the worker — used to parse the DB JSONB column.
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

// shardMeta maps stat shard IDs to display info. IDs and icons are fixed in the game client.
var shardMeta = map[int]struct{ name, icon string }{
	5008: {"Adaptive Force", "perk-images/StatMods/StatModsAdaptiveForceIcon.png"},
	5005: {"Attack Speed",   "perk-images/StatMods/StatModsAttackSpeedIcon.png"},
	5007: {"Ability Haste",  "perk-images/StatMods/StatModsCDRScalingIcon.png"},
	5002: {"Armor",          "perk-images/StatMods/StatModsArmorIcon.png"},
	5003: {"Magic Resist",   "perk-images/StatMods/StatModsMagicResIcon.png"},
	5001: {"Health Scaling", "perk-images/StatMods/StatModsHealthScalingIcon.png"},
}

func statShardToRune(id int) models.Rune {
	m, ok := shardMeta[id]
	if !ok {
		return models.Rune{ID: id, Name: fmt.Sprintf("Shard %d", id)}
	}
	return models.Rune{ID: id, Name: m.name, ImageURL: riot.RuneIconURL(m.icon)}
}

// GetChampionRunes returns aggregated rune data for a champion
func (h *Handler) GetChampionRunes(c *fiber.Ctx) error {
	ctx := c.Context()
	id := c.Params("id")
	role := c.Query("role", "")
	patch := c.Query("patch", "")
	region := c.Query("region", h.region)

	if patch == "" {
		if v, err := h.getVersion(ctx); err == nil {
			patch = patchFromVersion(v)
		}
	}

	cacheKey := fmt.Sprintf("champion:runes:%s:%s:%s:%s", id, patch, role, region)
	var runes models.RuneBuild
	if err := h.cache.Get(ctx, cacheKey, &runes); err == nil {
		return c.JSON(runes)
	}

	query := `SELECT rune_data FROM champion_runes WHERE champion_id = $1 AND patch = $2 AND region = $3`
	args := []any{id, patch, region}
	if role != "" {
		query += " AND role = $4 ORDER BY sample_size DESC LIMIT 1"
		args = append(args, role)
	} else {
		query += " ORDER BY sample_size DESC LIMIT 1"
	}

	var runeJSON []byte
	err := h.db.Pool.QueryRow(ctx, query, args...).Scan(&runeJSON)
	if err != nil || len(runeJSON) == 0 {
		return c.JSON(models.RuneBuild{ChampionID: id, Patch: patch, Role: role, Region: region})
	}

	var stored storedRuneData
	if err := json.Unmarshal(runeJSON, &stored); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid rune data"})
	}

	// PrimaryPathID == 0 means the data was written in the old flat format — treat as empty.
	if stored.PrimaryPathID == 0 {
		return c.JSON(models.RuneBuild{ChampionID: id, Patch: patch, Role: role, Region: region})
	}

	runes = models.RuneBuild{
		ChampionID: id,
		Patch:      stored.Patch,
		Role:       stored.Role,
		Region:     stored.Region,
		SampleSize: stored.SampleSize,
		WinRate:    stored.WinRate,
		Games:      stored.Games,
	}

	// Enrich with Data Dragon path and rune metadata
	version, _ := h.getVersion(ctx)
	if version != "" {
		ddPaths, ddErr := h.riotClient.GetAllRunes(ctx, version)
		if ddErr == nil {
			pathByID := make(map[int]models.DataDragonRunePath, len(ddPaths))
			runeByID := make(map[int]models.DataDragonRune)
			for _, p := range ddPaths {
				pathByID[p.ID] = p
				for _, slot := range p.Slots {
					for _, r := range slot.Runes {
						runeByID[r.ID] = r
					}
				}
			}
			if p, ok := pathByID[stored.PrimaryPathID]; ok {
				runes.PrimaryPath = models.RunePath{ID: p.ID, Key: p.Key, Name: p.Name, IconURL: riot.RuneIconURL(p.Icon)}
			}
			if p, ok := pathByID[stored.SecondaryPathID]; ok {
				runes.SecondaryPath = models.RunePath{ID: p.ID, Key: p.Key, Name: p.Name, IconURL: riot.RuneIconURL(p.Icon)}
			}
			for _, rid := range stored.PrimaryRuneIDs {
				if r, ok := runeByID[rid]; ok {
					runes.PrimaryRunes = append(runes.PrimaryRunes, models.Rune{ID: r.ID, Key: r.Key, Name: r.Name, ImageURL: riot.RuneIconURL(r.Icon)})
				}
			}
			for _, rid := range stored.SecondaryRuneIDs {
				if r, ok := runeByID[rid]; ok {
					runes.SecondaryRunes = append(runes.SecondaryRunes, models.Rune{ID: r.ID, Key: r.Key, Name: r.Name, ImageURL: riot.RuneIconURL(r.Icon)})
				}
			}
			for _, sid := range stored.ShardIDs {
				runes.Shards = append(runes.Shards, statShardToRune(sid))
			}
		}
	}

	h.cache.Set(ctx, cacheKey, runes, cache.TTLRunes)
	return c.JSON(runes)
}

// GetChampionCounters returns counter matchup data for a champion
func (h *Handler) GetChampionCounters(c *fiber.Ctx) error {
	ctx := c.Context()
	id := c.Params("id")
	role := c.Query("role", "")
	patch := c.Query("patch", "")
	region := c.Query("region", h.region)

	if patch == "" {
		if v, err := h.getVersion(ctx); err == nil {
			patch = patchFromVersion(v)
		}
	}

	cacheKey := fmt.Sprintf("champion:counters:%s:%s:%s:%s", id, patch, role, region)
	var counters models.ChampionCounters
	if err := h.cache.Get(ctx, cacheKey, &counters); err == nil {
		return c.JSON(counters)
	}

	query := `SELECT counter_data FROM champion_counters WHERE champion_id = $1 AND patch = $2 AND region = $3`
	args := []any{id, patch, region}
	if role != "" {
		query += " AND role = $4 ORDER BY sample_size DESC LIMIT 1"
		args = append(args, role)
	} else {
		query += " ORDER BY sample_size DESC LIMIT 1"
	}

	var counterJSON []byte
	err := h.db.Pool.QueryRow(ctx, query, args...).Scan(&counterJSON)
	if err != nil || len(counterJSON) == 0 {
		return c.JSON(models.ChampionCounters{
			ChampionID: id,
			Patch:      patch,
			Role:       role,
			Region:     region,
		})
	}

	if err := json.Unmarshal(counterJSON, &counters); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid counter data"})
	}

	h.cache.Set(ctx, cacheKey, counters, cache.TTLCounters)
	return c.JSON(counters)
}

// GetMeta returns top champions by win/pick/ban rate
func (h *Handler) GetMeta(c *fiber.Ctx) error {
	ctx := c.Context()
	region := c.Query("region", h.region)
	role := c.Query("role", "")

	cacheKey := fmt.Sprintf("meta:top:%s:%s", region, role)
	var meta models.MetaTop
	if err := h.cache.Get(ctx, cacheKey, &meta); err == nil {
		return c.JSON(meta)
	}

	version, _ := h.getVersion(ctx)
	patch := patchFromVersion(version)
	allChamps, _ := h.riotClient.GetAllChampions(ctx, version)

	topBy := func(orderBy string) []models.ChampionWithStats {
		query := `
		SELECT champion_id, SUM(wins), SUM(losses), SUM(games), SUM(bans), MAX(total_games)
		FROM champion_stats
		WHERE patch = $1 AND region = $2`
		args := []any{patch, region}
		if role != "" {
			query += " AND role = $3"
			args = append(args, role)
		}
		query += fmt.Sprintf(`
		GROUP BY champion_id
		HAVING SUM(games) >= 50
		ORDER BY %s DESC
		LIMIT 20`, orderBy)

		rows, err := h.db.Pool.Query(ctx, query, args...)
		if err != nil {
			return nil
		}
		defer rows.Close()

		var entries []models.ChampionWithStats
		for rows.Next() {
			var champID string
			var wins, losses, games, bans, totalGames int
			if err := rows.Scan(&champID, &wins, &losses, &games, &bans, &totalGames); err != nil {
				continue
			}
			stats := models.ChampionStats{
				ChampionID: champID,
				Patch:      patch,
				Region:     region,
				Role:       role,
				Wins:       wins,
				Losses:     losses,
				Games:      games,
				SampleSize: games,
			}
			if games > 0 {
				stats.WinRate = float64(wins) / float64(games)
			}
			if totalGames > 0 {
				stats.PickRate = float64(games) / float64(totalGames)
				stats.BanRate = float64(bans) / float64(totalGames)
			}

			var champ models.Champion
			if dd, ok := allChamps[champID]; ok {
				champ = ddToChampion(dd, version)
			} else {
				champ = models.Champion{ID: champID, Name: champID}
			}

			entries = append(entries, models.ChampionWithStats{
				Champion: champ,
				Stats:    stats,
			})
		}
		return entries
	}

	meta.Patch = patch
	meta.Region = region
	meta.TopWinRate = topBy("SUM(wins)::float / NULLIF(SUM(games), 0)")
	meta.TopPickRate = topBy("SUM(games)::float / NULLIF(MAX(total_games), 0)")
	meta.TopBanRate = topBy("SUM(bans)::float / NULLIF(MAX(total_games), 0)")
	h.cache.Set(ctx, cacheKey, meta, cache.TTLMeta)
	return c.JSON(meta)
}

// ---- helpers ----

func (h *Handler) getVersion(ctx context.Context) (string, error) {
	var version string
	if err := h.cache.Get(ctx, "dd:version", &version); err == nil {
		return version, nil
	}
	v, err := h.riotClient.GetLatestVersion(ctx)
	if err != nil {
		return "", err
	}
	h.cache.Set(ctx, "dd:version", v, cache.TTLVersion)
	return v, nil
}

func (h *Handler) enrichBuildItems(ctx context.Context, build models.ChampionBuild, version string) models.ChampionBuild {
	items, err := h.riotClient.GetAllItems(ctx, version)
	if err != nil {
		return build
	}

	enrich := func(builds []models.ItemBuild) []models.ItemBuild {
		for i := range builds {
			if dd, ok := items[builds[i].ItemID]; ok {
				builds[i].Item = &models.Item{
					ID:          builds[i].ItemID,
					Name:        dd.Name,
					Description: dd.Description,
					ImageURL:    riot.ItemIconURL(version, dd.Image.Full),
					Gold:        dd.Gold.Total,
				}
			}
		}
		return builds
	}

	build.CoreItems = enrich(build.CoreItems)
	build.StarterItems = enrich(build.StarterItems)
	build.BootItems = enrich(build.BootItems)
	return build
}

func ddToChampion(dd models.DataDragonChamp, version string) models.Champion {
	return models.Champion{
		ID:        dd.ID,
		Key:       dd.Key,
		Name:      dd.Name,
		Title:     dd.Title,
		Blurb:     dd.Blurb,
		ImageURL:  riot.ChampionIconURL(version, dd.Image.Full),
		SplashURL: riot.ChampionSplashURL(dd.ID),
		Tags:      dd.Tags,
		Stats:     dd.Stats,
		Version:   version,
	}
}

func patchFromVersion(version string) string {
	parts := strings.SplitN(version, ".", 3)
	if len(parts) >= 2 {
		return parts[0] + "." + parts[1]
	}
	return version
}
