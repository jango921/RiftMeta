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
		return c.JSON(models.RuneBuild{
			ChampionID: id,
			Patch:      patch,
			Role:       role,
			Region:     region,
		})
	}

	if err := json.Unmarshal(runeJSON, &runes); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "invalid rune data"})
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

	cacheKey := fmt.Sprintf("meta:top:%s", region)
	var meta models.MetaTop
	if err := h.cache.Get(ctx, cacheKey, &meta); err == nil {
		return c.JSON(meta)
	}

	version, _ := h.getVersion(ctx)
	patch := patchFromVersion(version)

	rows, err := h.db.Pool.Query(ctx, `
		SELECT champion_id, SUM(wins), SUM(losses), SUM(games), SUM(bans), MAX(total_games)
		FROM champion_stats
		WHERE patch = $1 AND region = $2
		GROUP BY champion_id
		HAVING SUM(games) >= 50
		ORDER BY SUM(wins)::float / NULLIF(SUM(games), 0) DESC
		LIMIT 20`, patch, region)
	if err != nil {
		meta = models.MetaTop{Patch: patch, Region: region}
		return c.JSON(meta)
	}
	defer rows.Close()

	// Fetch champion list to enrich
	allChamps, _ := h.riotClient.GetAllChampions(ctx, version)

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

		meta.TopWinRate = append(meta.TopWinRate, models.ChampionWithStats{
			Champion: champ,
			Stats:    stats,
		})
	}

	meta.Patch = patch
	meta.Region = region
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
