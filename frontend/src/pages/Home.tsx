import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Crosshair, Filter, Flame, Shield, Sparkles, Swords } from 'lucide-react'
import { fetchChampions, fetchMetaTop, fetchVersion } from '../api/client'
import SearchHero from '../components/home/SearchHero'
import TopChampions from '../components/home/TopChampions'
import WorkerStatus from '../components/home/WorkerStatus'
import ChampionCard from '../components/common/ChampionCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Champion, ChampionWithStats, Role } from '../types'

const ROLE_FILTERS: { value: Role | ''; label: string; short: string }[] = [
  { value: '', label: 'All Roles', short: 'ALL' },
  { value: 'TOP', label: 'Top', short: 'TOP' },
  { value: 'JUNGLE', label: 'Jungle', short: 'JNG' },
  { value: 'MIDDLE', label: 'Mid', short: 'MID' },
  { value: 'BOTTOM', label: 'Bot', short: 'BOT' },
  { value: 'UTILITY', label: 'Support', short: 'SUP' },
]

const CLASS_FILTERS = ['All', 'Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'] as const
type ClassFilter = typeof CLASS_FILTERS[number]

function pct(value?: number) {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '-'
}

function metaScore(entry: ChampionWithStats) {
  const { winRate, pickRate, banRate } = entry.stats
  return (winRate * 100) + (pickRate * 25) + (banRate * 14)
}

function tierFor(entry: ChampionWithStats, index: number) {
  const score = metaScore(entry)
  if (index < 4 || score >= 54) return 'S+'
  if (index < 10 || score >= 52) return 'S'
  return 'A'
}

function MetaTierList({ items }: { items: ChampionWithStats[] }) {
  if (!items.length) {
    return (
      <div className="rift-panel-gold p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
          <Sparkles className="h-5 w-5 text-gold-400" />
        </div>
        <p className="text-sm font-semibold text-slate-300">No tier data yet</p>
        <p className="mt-1 text-xs text-slate-500">Run the data worker to populate the live meta board.</p>
      </div>
    )
  }

  const rows = items.slice(0, 14)

  return (
    <div className="rift-panel-gold">
      <div className="panel-header">
        <Flame className="h-4 w-4 text-gold-400" />
        <span className="panel-title">Meta Tier Board</span>
        <span className="ml-auto hidden text-xs text-slate-500 sm:inline">Score blends WR, pick, and ban pressure</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.025]">
              {['Tier', 'Champion', 'Win Rate', 'Pick Rate', 'Ban Rate', 'Games'].map((header, i) => (
                <th
                  key={header}
                  className={clsx(
                    'px-4 py-3 text-xs font-bold uppercase text-slate-500',
                    i === 1 ? 'text-left' : 'text-right',
                    i === 0 && 'w-16 text-center'
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, index) => {
              const tier = tierFor(entry, index)
              return (
                <tr key={entry.champion.id} className="data-row">
                  <td className="px-4 py-3 text-center">
                    <span className={clsx(
                      'inline-flex h-8 min-w-10 items-center justify-center rounded-md border px-2 font-mono text-sm font-black',
                      tier === 'S+' ? 'border-gold-400/50 bg-gold-500/10 text-gold-300' :
                      tier === 'S' ? 'border-teal-400/40 bg-teal-400/10 text-teal-300' :
                      'border-blue-400/30 bg-blue-400/10 text-blue-300'
                    )}>
                      {tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/champion/${entry.champion.id}`} className="group flex items-center gap-3">
                      <img src={entry.champion.imageUrl} alt={entry.champion.name} className="h-10 w-10 rounded-md border border-white/10 object-cover" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-slate-100 group-hover:text-gold-300">{entry.champion.name}</div>
                        <div className="truncate text-xs text-slate-500">{entry.champion.tags?.join(' / ')}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-300">{pct(entry.stats.winRate)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{pct(entry.stats.pickRate)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-red-300">{pct(entry.stats.banRate)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">{entry.stats.games.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QuickStat({ icon: Icon, label, value }: { icon: typeof Swords; label: string; value: string }) {
  return (
    <div className="rift-panel px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gold-400/20 bg-gold-400/10">
          <Icon className="h-4 w-4 text-gold-300" />
        </div>
        <div>
          <div className="font-mono text-lg font-black text-white">{value}</div>
          <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [role, setRole] = useState<Role | ''>('')
  const [classFilter, setClassFilter] = useState<ClassFilter>('All')
  const [query, setQuery] = useState('')

  const { data: version = '' } = useQuery({ queryKey: ['version'], queryFn: fetchVersion })

  const { data: champions = [], isLoading } = useQuery({
    queryKey: ['champions'],
    queryFn: fetchChampions,
    staleTime: 30 * 60 * 1000,
  })

  const { data: meta, isFetching: metaFetching } = useQuery({
    queryKey: ['meta', 'top', role],
    queryFn: () => fetchMetaTop(undefined, role || undefined),
    staleTime: 15 * 60 * 1000,
  })

  const sorted = useMemo(() => [...champions].sort((a, b) => a.name.localeCompare(b.name)), [champions])
  const filteredChampions = useMemo(() => {
    return sorted.filter((champ: Champion) => {
      const matchesClass = classFilter === 'All' || champ.tags?.includes(classFilter)
      const needle = query.trim().toLowerCase()
      const matchesSearch = !needle || champ.name.toLowerCase().includes(needle) || champ.title.toLowerCase().includes(needle)
      return matchesClass && matchesSearch
    })
  }, [sorted, classFilter, query])

  const primaryMeta = meta?.topWinRate ?? []
  const hottest = [...primaryMeta].sort((a, b) => metaScore(b) - metaScore(a))[0]
  const totalGames = primaryMeta.reduce((sum, entry) => sum + entry.stats.games, 0)
  const featured = primaryMeta.slice(0, 3).map(entry => entry.champion)
  const roleLabel = ROLE_FILTERS.find(item => item.value === role)?.label ?? 'All Roles'

  return (
    <div className="rift-bg">
      <SearchHero champions={champions} version={version} featured={featured} />

      <div className="rift-shell pb-20">
        <div className="-mt-3 mb-6">
          <WorkerStatus />
        </div>

        <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <QuickStat icon={Swords} label="Champions" value={champions.length.toString()} />
          <QuickStat icon={Crosshair} label="Analyzed Games" value={totalGames > 0 ? totalGames.toLocaleString() : '-'} />
          <QuickStat icon={Shield} label="Patch" value={meta?.patch || version.split('.').slice(0, 2).join('.') || '-'} />
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="rift-section-title">Current Meta</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {roleLabel} Champion Rankings
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLE_FILTERS.map(item => (
                <button
                  key={item.short}
                  onClick={() => setRole(item.value)}
                  className={clsx('role-btn', role === item.value && 'role-btn-active')}
                >
                  {item.short}
                </button>
              ))}
            </div>
          </div>

          {metaFetching && !meta ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.9fr]">
              <MetaTierList items={primaryMeta} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <TopChampions title="Win Rate" accent="#34d399" items={meta?.topWinRate ?? []} valueKey="winRate" />
                <TopChampions title="Pick Rate" accent="#60a5fa" items={meta?.topPickRate ?? []} valueKey="pickRate" />
                <TopChampions title="Ban Rate" accent="#f87171" items={meta?.topBanRate ?? []} valueKey="banRate" />
              </div>
            </div>
          )}
        </section>

        {hottest && (
          <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rift-panel-gold relative min-h-[300px] overflow-hidden">
              <img src={hottest.champion.splashUrl} alt={hottest.champion.name} className="absolute inset-0 h-full w-full object-cover object-top opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/72 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="rift-section-title">Meta Breakout</div>
                <h3 className="mt-2 font-display text-4xl font-black text-white text-glow-gold">{hottest.champion.name}</h3>
                <p className="mt-1 max-w-md text-sm capitalize text-slate-300">{hottest.champion.title}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="stat-chip text-emerald-300">{pct(hottest.stats.winRate)} WR</span>
                  <span className="stat-chip text-blue-300">{pct(hottest.stats.pickRate)} Pick</span>
                  <span className="stat-chip text-red-300">{pct(hottest.stats.banRate)} Ban</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {featured.map(champ => (
                <ChampionCard key={champ.id} champion={champ} featured showStats={false} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="rift-section-title">Champion Explorer</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">All Champions</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Filter champions"
                  className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white outline-none transition focus:border-gold-400/50 sm:w-64"
                />
              </div>
              <div className="flex max-w-full gap-2 overflow-x-auto scrollbar-none">
                {CLASS_FILTERS.map(item => (
                  <button
                    key={item}
                    onClick={() => setClassFilter(item)}
                    className={clsx('role-btn shrink-0', classFilter === item && 'role-btn-active')}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner size="lg" className="py-20" />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12">
              {filteredChampions.map(champ => (
                <ChampionCard key={champ.id} champion={champ} showStats={false} size="sm" />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
