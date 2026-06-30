package riot

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/riftmeta/backend/internal/models"
)

const ddBase = "https://ddragon.leagueoflegends.com"

// GetAllChampions fetches the full champion list for a given patch version
func (c *RiotClient) GetAllChampions(ctx context.Context, version string) (map[string]models.DataDragonChamp, error) {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/champion.json", ddBase, version)
	b, err := c.get(ctx, url, false)
	if err != nil {
		return nil, err
	}

	var resp models.DataDragonResponse
	if err := json.Unmarshal(b, &resp); err != nil {
		return nil, fmt.Errorf("parse champions: %w", err)
	}
	return resp.Data, nil
}

// GetChampionDetail fetches full detail (including spells) for a single champion
func (c *RiotClient) GetChampionDetail(ctx context.Context, version, championID string) (*DataDragonChampionDetail, error) {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/champion/%s.json", ddBase, version, championID)
	b, err := c.get(ctx, url, false)
	if err != nil {
		return nil, err
	}

	var resp DataDragonChampionDetailResponse
	if err := json.Unmarshal(b, &resp); err != nil {
		return nil, fmt.Errorf("parse champion detail: %w", err)
	}

	detail, ok := resp.Data[championID]
	if !ok {
		return nil, fmt.Errorf("champion %s not found in response", championID)
	}
	return &detail, nil
}

// GetAllItems fetches the full item list
func (c *RiotClient) GetAllItems(ctx context.Context, version string) (map[string]models.DataDragonItem, error) {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/item.json", ddBase, version)
	b, err := c.get(ctx, url, false)
	if err != nil {
		return nil, err
	}

	var resp models.DataDragonItems
	if err := json.Unmarshal(b, &resp); err != nil {
		return nil, fmt.Errorf("parse items: %w", err)
	}
	return resp.Data, nil
}

// GetAllRunes fetches all rune paths with their runes
func (c *RiotClient) GetAllRunes(ctx context.Context, version string) ([]models.DataDragonRunePath, error) {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/runesReforged.json", ddBase, version)
	b, err := c.get(ctx, url, false)
	if err != nil {
		return nil, err
	}

	var paths []models.DataDragonRunePath
	if err := json.Unmarshal(b, &paths); err != nil {
		return nil, fmt.Errorf("parse runes: %w", err)
	}
	return paths, nil
}

// GetAllSummonerSpells fetches all summoner spells
func (c *RiotClient) GetAllSummonerSpells(ctx context.Context, version string) (map[string]SummonerSpellData, error) {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/summoner.json", ddBase, version)
	b, err := c.get(ctx, url, false)
	if err != nil {
		return nil, err
	}

	var resp SummonerSpellResponse
	if err := json.Unmarshal(b, &resp); err != nil {
		return nil, fmt.Errorf("parse summoner spells: %w", err)
	}
	return resp.Data, nil
}

// ChampionIconURL returns the champion icon URL for a given version and image filename
func ChampionIconURL(version, filename string) string {
	return fmt.Sprintf("%s/cdn/%s/img/champion/%s", ddBase, version, filename)
}

// ChampionSplashURL returns the splash art URL (index 0 = default skin)
func ChampionSplashURL(championID string) string {
	return fmt.Sprintf("%s/cdn/img/champion/splash/%s_0.jpg", ddBase, championID)
}

// ItemIconURL returns the item icon URL
func ItemIconURL(version, filename string) string {
	return fmt.Sprintf("%s/cdn/%s/img/item/%s", ddBase, version, filename)
}

// RuneIconURL returns the rune icon URL
func RuneIconURL(iconPath string) string {
	return fmt.Sprintf("%s/cdn/img/%s", ddBase, iconPath)
}

// SpellIconURL returns the summoner spell icon URL
func SpellIconURL(version, filename string) string {
	return fmt.Sprintf("%s/cdn/%s/img/spell/%s", ddBase, version, filename)
}

// ---- Raw Data Dragon DTO types ----

type DataDragonChampionDetailResponse struct {
	Data map[string]DataDragonChampionDetail `json:"data"`
}

type DataDragonChampionDetail struct {
	ID     string                 `json:"id"`
	Key    string                 `json:"key"`
	Name   string                 `json:"name"`
	Title  string                 `json:"title"`
	Spells []ChampionSpell        `json:"spells"`
	Stats  map[string]float64     `json:"stats"`
}

type ChampionSpell struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Image       models.DataDragonImage `json:"image"`
}

type SummonerSpellResponse struct {
	Data map[string]SummonerSpellData `json:"data"`
}

type SummonerSpellData struct {
	ID    string                 `json:"id"`
	Name  string                 `json:"name"`
	Key   string                 `json:"key"`
	Image models.DataDragonImage `json:"image"`
}
