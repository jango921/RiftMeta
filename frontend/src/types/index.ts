export interface Champion {
  id: string
  key: string
  name: string
  title: string
  blurb: string
  imageUrl: string
  splashUrl: string
  tags: string[]
  stats: Record<string, number>
  version: string
}

export interface ChampionStats {
  championId: string
  patch: string
  role: string
  region: string
  winRate: number
  pickRate: number
  banRate: number
  wins: number
  losses: number
  games: number
  sampleSize: number
}

export interface Item {
  id: string
  name: string
  description: string
  imageUrl: string
  gold: number
}

export interface ItemBuild {
  itemId: string
  item?: Item
  pickRate: number
  winRate: number
  games: number
  avgSlot: number
}

export interface SummonerSpell {
  id: string
  name: string
  imageUrl: string
}

export interface SummonerSpellBuild {
  spell1: SummonerSpell
  spell2: SummonerSpell
  winRate: number
  pickRate: number
  games: number
}

export interface SkillOrder {
  order: string[]
  firstSkill: string
  maxOrder: string[]
}

export interface ChampionBuild {
  championId: string
  patch: string
  role: string
  region: string
  starterItems: ItemBuild[]
  coreItems: ItemBuild[]
  bootItems: ItemBuild[]
  popularBuilds: BuildSet[]
  summonerSpells: SummonerSpellBuild[]
  skillOrder: SkillOrder
  sampleSize: number
}

export interface BuildSet {
  items: ItemBuild[]
  winRate: number
  games: number
}

export interface Rune {
  id: number
  key: string
  name: string
  imageUrl: string
  shortDesc: string
}

export interface RunePath {
  id: number
  key: string
  name: string
  iconUrl: string
  slots: { runes: Rune[] }[]
}

export interface RuneBuild {
  championId: string
  patch: string
  role: string
  region: string
  primaryPath: RunePath
  primaryRunes: Rune[]
  secondaryPath: RunePath
  secondaryRunes: Rune[]
  shards: Rune[]
  winRate: number
  pickRate: number
  games: number
  sampleSize: number
}

export interface Counter {
  championId: string
  champion?: Champion
  winRate: number
  games: number
  goldDiff: number
  csDiff: number
}

export interface ChampionCounters {
  championId: string
  patch: string
  role: string
  region: string
  countersWith: Counter[]
  countersAgainst: Counter[]
  sampleSize: number
}

export interface ChampionWithStats {
  champion: Champion
  stats: ChampionStats
}

export interface MetaTop {
  patch: string
  region: string
  topWinRate: ChampionWithStats[]
  topPickRate: ChampionWithStats[]
  topBanRate: ChampionWithStats[]
}

export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY'

export const ROLES: { value: Role; label: string; icon: string }[] = [
  { value: 'TOP',     label: 'Top',     icon: '⚔️' },
  { value: 'JUNGLE',  label: 'Jungle',  icon: '🌿' },
  { value: 'MIDDLE',  label: 'Mid',     icon: '🔮' },
  { value: 'BOTTOM',  label: 'Bot',     icon: '🏹' },
  { value: 'UTILITY', label: 'Support', icon: '🛡️' },
]
