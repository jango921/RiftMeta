package riot

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

const (
	// Riot personal API key rate limits: 20 req/s, 100 req/2min
	// We stay well below those limits
	ratePerSecond = 15
	rateBurst     = 20

	baseDataDragonURL = "https://ddragon.leagueoflegends.com"
)

// RiotClient handles all communication with Riot APIs and Data Dragon
type RiotClient struct {
	httpClient *http.Client
	limiter    *rate.Limiter
	apiKey     string
}

// New creates a rate-limited Riot API client
func New(apiKey string) *RiotClient {
	return &RiotClient{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		limiter:    rate.NewLimiter(rate.Every(time.Second/ratePerSecond), rateBurst),
		apiKey:     apiKey,
	}
}

// get performs a GET request with rate limiting and API key injection
func (c *RiotClient) get(ctx context.Context, url string, withAuth bool) ([]byte, error) {
	if err := c.limiter.Wait(ctx); err != nil {
		return nil, fmt.Errorf("rate limiter: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}

	if withAuth {
		req.Header.Set("X-Riot-Token", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http get: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		// Back off and retry once
		time.Sleep(2 * time.Second)
		return c.get(ctx, url, withAuth)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("riot api returned %d for %s", resp.StatusCode, url)
	}

	return io.ReadAll(resp.Body)
}

// GetLatestVersion returns the latest Data Dragon version string
func (c *RiotClient) GetLatestVersion(ctx context.Context) (string, error) {
	b, err := c.get(ctx, baseDataDragonURL+"/api/versions.json", false)
	if err != nil {
		return "", err
	}

	var versions []string
	if err := json.Unmarshal(b, &versions); err != nil || len(versions) == 0 {
		return "", fmt.Errorf("parse versions: %w", err)
	}

	return versions[0], nil
}

// GetMatchIDs returns recent ranked match IDs for an account
func (c *RiotClient) GetMatchIDs(ctx context.Context, routing, puuid string, start, count int) ([]string, error) {
	url := fmt.Sprintf(
		"https://%s.api.riotgames.com/lol/match/v5/matches/by-puuid/%s/ids?queue=420&type=ranked&start=%d&count=%d",
		routing, puuid, start, count,
	)

	b, err := c.get(ctx, url, true)
	if err != nil {
		return nil, err
	}

	var ids []string
	if err := json.Unmarshal(b, &ids); err != nil {
		return nil, fmt.Errorf("parse match ids: %w", err)
	}
	return ids, nil
}

// GetMatch returns full match data for a given match ID
func (c *RiotClient) GetMatch(ctx context.Context, routing, matchID string) (*MatchDTO, error) {
	url := fmt.Sprintf("https://%s.api.riotgames.com/lol/match/v5/matches/%s", routing, matchID)

	b, err := c.get(ctx, url, true)
	if err != nil {
		return nil, err
	}

	var match MatchDTO
	if err := json.Unmarshal(b, &match); err != nil {
		return nil, fmt.Errorf("parse match: %w", err)
	}
	return &match, nil
}

// GetLeaguePlayers returns apex-tier players for seeding match collection.
func (c *RiotClient) GetLeaguePlayers(ctx context.Context, region, tier string) (*LeagueListDTO, error) {
	url := fmt.Sprintf(
		"https://%s.api.riotgames.com/lol/league/v4/%sleagues/by-queue/RANKED_SOLO_5x5",
		region, tier,
	)

	b, err := c.get(ctx, url, true)
	if err != nil {
		return nil, err
	}

	var league LeagueListDTO
	if err := json.Unmarshal(b, &league); err != nil {
		return nil, fmt.Errorf("parse challenger league: %w", err)
	}
	return &league, nil
}

// GetChallengerPlayers returns Challenger-tier players for diagnostics and default seeding.
func (c *RiotClient) GetChallengerPlayers(ctx context.Context, region string) (*LeagueListDTO, error) {
	return c.GetLeaguePlayers(ctx, region, "challenger")
}

// GetSummonerByID returns summoner data by encrypted summoner ID
func (c *RiotClient) GetSummonerByID(ctx context.Context, region, summonerID string) (*SummonerDTO, error) {
	url := fmt.Sprintf(
		"https://%s.api.riotgames.com/lol/summoner/v4/summoners/%s",
		region, summonerID,
	)

	b, err := c.get(ctx, url, true)
	if err != nil {
		return nil, err
	}

	var summoner SummonerDTO
	if err := json.Unmarshal(b, &summoner); err != nil {
		return nil, fmt.Errorf("parse summoner: %w", err)
	}
	return &summoner, nil
}
