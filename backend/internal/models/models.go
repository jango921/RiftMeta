package models

// Champion represents a League champion from Data Dragon
type Champion struct {
	ID       string            `json:"id"`
	Key      string            `json:"key"`
	Name     string            `json:"name"`
	Title    string            `json:"title"`
	Blurb    string            `json:"blurb"`
	ImageURL string            `json:"imageUrl"`
	SplashURL string           `json:"splashUrl"`
	Tags     []string          `json:"tags"`
	Stats    map[string]float64 `json:"stats"`
	Version  string            `json:"version"`
}

// ChampionStats holds aggregated ranked stats for a champion
type ChampionStats struct {
	ChampionID string  `json:"championId"`
	Patch      string  `json:"patch"`
	Role       string  `json:"role"`
	Region     string  `json:"region"`
	WinRate    float64 `json:"winRate"`
	PickRate   float64 `json:"pickRate"`
	BanRate    float64 `json:"banRate"`
	Wins       int     `json:"wins"`
	Losses     int     `json:"losses"`
	Games      int     `json:"games"`
	SampleSize int     `json:"sampleSize"`
}

// Item represents a League item
type Item struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	ImageURL    string  `json:"imageUrl"`
	Gold        int     `json:"gold"`
}

// ItemBuild holds aggregated item purchase data
type ItemBuild struct {
	ItemID     string  `json:"itemId"`
	Item       *Item   `json:"item,omitempty"`
	PickRate   float64 `json:"pickRate"`
	WinRate    float64 `json:"winRate"`
	Games      int     `json:"games"`
	AvgSlot    float64 `json:"avgSlot"` // average build slot position
}

// BuildSet represents a complete popular build (set of 6 items)
type BuildSet struct {
	Items    []ItemBuild `json:"items"`
	WinRate  float64     `json:"winRate"`
	Games    int         `json:"games"`
}

// ChampionBuild holds full build data for a champion
type ChampionBuild struct {
	ChampionID   string      `json:"championId"`
	Patch        string      `json:"patch"`
	Role         string      `json:"role"`
	Region       string      `json:"region"`
	StarterItems []ItemBuild `json:"starterItems"`
	CoreItems    []ItemBuild `json:"coreItems"`
	BootItems    []ItemBuild `json:"bootItems"`
	PopularBuilds []BuildSet `json:"popularBuilds"`
	SummonerSpells []SummonerSpellBuild `json:"summonerSpells"`
	SkillOrder   SkillOrder  `json:"skillOrder"`
	SampleSize   int         `json:"sampleSize"`
}

// SummonerSpell represents a summoner spell
type SummonerSpell struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl"`
}

// SummonerSpellBuild holds popular summoner spell combos
type SummonerSpellBuild struct {
	Spell1   SummonerSpell `json:"spell1"`
	Spell2   SummonerSpell `json:"spell2"`
	WinRate  float64       `json:"winRate"`
	PickRate float64       `json:"pickRate"`
	Games    int           `json:"games"`
}

// SkillOrder tracks the most popular skill leveling order
type SkillOrder struct {
	Order     []string `json:"order"` // e.g. ["Q","W","E","Q","Q","R"...]
	FirstSkill string  `json:"firstSkill"`
	MaxOrder  []string `json:"maxOrder"` // e.g. ["Q","E","W"]
}

// Rune represents a single rune
type Rune struct {
	ID       int    `json:"id"`
	Key      string `json:"key"`
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl"`
	ShortDesc string `json:"shortDesc"`
}

// RunePath represents a rune tree/path
type RunePath struct {
	ID    int    `json:"id"`
	Key   string `json:"key"`
	Name  string `json:"name"`
	IconURL string `json:"iconUrl"`
	Slots []RuneSlot `json:"slots"`
}

// RuneSlot holds runes available in a slot
type RuneSlot struct {
	Runes []Rune `json:"runes"`
}

// RuneBuild holds aggregated rune data for a champion
type RuneBuild struct {
	ChampionID     string    `json:"championId"`
	Patch          string    `json:"patch"`
	Role           string    `json:"role"`
	Region         string    `json:"region"`
	PrimaryPath    RunePath  `json:"primaryPath"`
	PrimaryRunes   []Rune    `json:"primaryRunes"` // 4 runes chosen
	SecondaryPath  RunePath  `json:"secondaryPath"`
	SecondaryRunes []Rune    `json:"secondaryRunes"` // 2 runes chosen
	Shards         []Rune    `json:"shards"` // stat shards
	WinRate        float64   `json:"winRate"`
	PickRate       float64   `json:"pickRate"`
	Games          int       `json:"games"`
	SampleSize     int       `json:"sampleSize"`
}

// Counter holds matchup data against a specific champion
type Counter struct {
	ChampionID    string   `json:"championId"`
	Champion      *Champion `json:"champion,omitempty"`
	WinRate       float64  `json:"winRate"` // win rate of our champ vs this counter
	Games         int      `json:"games"`
	GoldDiff      float64  `json:"goldDiff"`
	CSdiff        float64  `json:"csDiff"`
}

// ChampionCounters holds counter data for a champion
type ChampionCounters struct {
	ChampionID  string    `json:"championId"`
	Patch       string    `json:"patch"`
	Role        string    `json:"role"`
	Region      string    `json:"region"`
	CountersWith []Counter `json:"countersWith"` // champions we beat
	CountersAgainst []Counter `json:"countersAgainst"` // champions that beat us
	SampleSize  int       `json:"sampleSize"`
}

// MetaTop holds the top champions for the current patch
type MetaTop struct {
	Patch      string         `json:"patch"`
	Region     string         `json:"region"`
	TopWinRate []ChampionWithStats `json:"topWinRate"`
	TopPickRate []ChampionWithStats `json:"topPickRate"`
	TopBanRate []ChampionWithStats `json:"topBanRate"`
}

// ChampionWithStats bundles champion info with its stats
type ChampionWithStats struct {
	Champion Champion      `json:"champion"`
	Stats    ChampionStats `json:"stats"`
}

// DataDragonResponse is the top-level Data Dragon champion list response
type DataDragonResponse struct {
	Type    string                     `json:"type"`
	Format  string                     `json:"format"`
	Version string                     `json:"version"`
	Data    map[string]DataDragonChamp `json:"data"`
}

// DataDragonChamp is the raw champion data from Data Dragon
type DataDragonChamp struct {
	Version string             `json:"version"`
	ID      string             `json:"id"`
	Key     string             `json:"key"`
	Name    string             `json:"name"`
	Title   string             `json:"title"`
	Blurb   string             `json:"blurb"`
	Info    map[string]int     `json:"info"`
	Image   DataDragonImage    `json:"image"`
	Tags    []string           `json:"tags"`
	Partype string             `json:"partype"`
	Stats   map[string]float64 `json:"stats"`
}

// DataDragonImage is the image object from Data Dragon
type DataDragonImage struct {
	Full   string `json:"full"`
	Sprite string `json:"sprite"`
	Group  string `json:"group"`
}

// DataDragonItems is the raw item data from Data Dragon
type DataDragonItems struct {
	Type    string                    `json:"type"`
	Version string                    `json:"version"`
	Data    map[string]DataDragonItem `json:"data"`
}

// DataDragonItem is a single item from Data Dragon
type DataDragonItem struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Image       DataDragonImage `json:"image"`
	Gold        struct {
		Base  int `json:"base"`
		Total int `json:"total"`
	} `json:"gold"`
}

// DataDragonRunesResponse is the raw runes data from Data Dragon
type DataDragonRunesResponse []DataDragonRunePath

// DataDragonRunePath is a rune path from Data Dragon
type DataDragonRunePath struct {
	ID    int                    `json:"id"`
	Key   string                 `json:"key"`
	Icon  string                 `json:"icon"`
	Name  string                 `json:"name"`
	Slots []DataDragonRuneSlot   `json:"slots"`
}

// DataDragonRuneSlot is a slot within a path
type DataDragonRuneSlot struct {
	Runes []DataDragonRune `json:"runes"`
}

// DataDragonRune is a single rune
type DataDragonRune struct {
	ID        int    `json:"id"`
	Key       string `json:"key"`
	Icon      string `json:"icon"`
	Name      string `json:"name"`
	ShortDesc string `json:"shortDesc"`
	LongDesc  string `json:"longDesc"`
}

// Patch represents a game patch/version
type Patch struct {
	Version string `json:"version"`
}
