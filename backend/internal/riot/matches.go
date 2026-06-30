package riot

// MatchDTO is the full match data from Riot Match-V5 API
type MatchDTO struct {
	Metadata MatchMetadata `json:"metadata"`
	Info     MatchInfo     `json:"info"`
}

// MatchMetadata contains match ID and participant PUUIDs
type MatchMetadata struct {
	DataVersion  string   `json:"dataVersion"`
	MatchID      string   `json:"matchId"`
	Participants []string `json:"participants"`
}

// MatchInfo contains the actual game data
type MatchInfo struct {
	GameCreation     int64         `json:"gameCreation"`
	GameDuration     int           `json:"gameDuration"`
	GameID           int64         `json:"gameId"`
	GameMode         string        `json:"gameMode"`
	GameType         string        `json:"gameType"`
	GameVersion      string        `json:"gameVersion"`
	MapID            int           `json:"mapId"`
	Participants     []Participant `json:"participants"`
	PlatformID       string        `json:"platformId"`
	QueueID          int           `json:"queueId"`
	Teams            []Team        `json:"teams"`
}

// Participant holds all data for one player in a match
type Participant struct {
	Assists                     int    `json:"assists"`
	ChampionID                  int    `json:"championId"`
	ChampionName                string `json:"championName"`
	Deaths                      int    `json:"deaths"`
	GoldEarned                  int    `json:"goldEarned"`
	IndividualPosition          string `json:"individualPosition"` // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
	Item0                       int    `json:"item0"`
	Item1                       int    `json:"item1"`
	Item2                       int    `json:"item2"`
	Item3                       int    `json:"item3"`
	Item4                       int    `json:"item4"`
	Item5                       int    `json:"item5"`
	Item6                       int    `json:"item6"` // trinket
	Kills                       int    `json:"kills"`
	Perks                       Perks  `json:"perks"`
	PUUID                       string `json:"puuid"`
	Spell1Casts                 int    `json:"spell1Casts"`
	Spell2Casts                 int    `json:"spell2Casts"`
	SummonerSpell1ID            int    `json:"summoner1Id"`
	SummonerSpell2ID            int    `json:"summoner2Id"`
	TeamID                      int    `json:"teamId"`
	TeamPosition                string `json:"teamPosition"`
	TotalMinionsKilled          int    `json:"totalMinionsKilled"`
	NeutralMinionsKilled        int    `json:"neutralMinionsKilled"`
	Win                         bool   `json:"win"`
	Skill1Casts                 int    `json:"spell1Casts"`
	Skill2Casts                 int    `json:"spell2Casts"`
	Skill3Casts                 int    `json:"spell3Casts"`
	Skill4Casts                 int    `json:"spell4Casts"`
}

// Perks contains rune selections for a participant
type Perks struct {
	StatPerks   StatPerks    `json:"statPerks"`
	Styles      []PerkStyle  `json:"styles"`
}

// StatPerks are the three stat shard selections
type StatPerks struct {
	Defense int `json:"defense"`
	Flex    int `json:"flex"`
	Offense int `json:"offense"`
}

// PerkStyle represents a chosen rune path (primary or secondary)
type PerkStyle struct {
	Description string          `json:"description"` // "primaryStyle" or "subStyle"
	Selections  []PerkSelection `json:"selections"`
	Style       int             `json:"style"` // path ID
}

// PerkSelection is a chosen rune within a slot
type PerkSelection struct {
	Perk int `json:"perk"`
	Var1 int `json:"var1"`
	Var2 int `json:"var2"`
	Var3 int `json:"var3"`
}

// Team holds team-level data including bans
type Team struct {
	Bans    []BanDTO `json:"bans"`
	TeamID  int      `json:"teamId"`
	Win     bool     `json:"win"`
}

// BanDTO holds a banned champion per pick/ban phase
type BanDTO struct {
	ChampionID int `json:"championId"`
	PickTurn   int `json:"pickTurn"`
}

// LeagueListDTO is the response from the challenger/grandmaster endpoints
type LeagueListDTO struct {
	LeagueID string          `json:"leagueId"`
	Entries  []LeagueItemDTO `json:"entries"`
	Queue    string          `json:"queue"`
	Tier     string          `json:"tier"`
}

// LeagueItemDTO is one entry in a league
type LeagueItemDTO struct {
	SummonerID   string `json:"summonerId"`
	SummonerName string `json:"summonerName"`
	PUUID        string `json:"puuid"` // available in API v4.1+; use directly to skip summoner lookup
	LeaguePoints int    `json:"leaguePoints"`
	Rank         string `json:"rank"`
	Wins         int    `json:"wins"`
	Losses       int    `json:"losses"`
}

// SummonerDTO holds summoner information
type SummonerDTO struct {
	AccountID     string `json:"accountId"`
	ProfileIconID int    `json:"profileIconId"`
	RevisionDate  int64  `json:"revisionDate"`
	Name          string `json:"name"`
	ID            string `json:"id"`
	PUUID         string `json:"puuid"`
	SummonerLevel int    `json:"summonerLevel"`
}
