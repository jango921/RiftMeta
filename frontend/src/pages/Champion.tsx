import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import clsx from 'clsx'
import {
  fetchChampion,
  fetchChampionStats,
  fetchChampionBuilds,
  fetchChampionRunes,
  fetchChampionCounters,
} from '../api/client'
import StatsCards from '../components/champion/StatsCards'
import BuildSection from '../components/champion/BuildSection'
import RunePage from '../components/champion/RunePage'
import CounterPicks from '../components/champion/CounterPicks'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Role, ChampionStats, ChampionBuild, RuneBuild, ChampionCounters } from '../types'

const ROLES: { value: Role; label: string }[] = [
  { value: 'TOP',     label: 'Top' },
  { value: 'JUNGLE',  label: 'Jungle' },
  { value: 'MIDDLE',  label: 'Mid' },
  { value: 'BOTTOM',  label: 'Bot' },
  { value: 'UTILITY', label: 'Support' },
]

const TABS = ['Overview', 'Builds', 'Runes', 'Counters'] as const
type Tab = (typeof TABS)[number]

const EMPTY_STATS: ChampionStats = {
  championId: '', patch: '', role: '', region: '', winRate: 0,
  pickRate: 0, banRate: 0, wins: 0, losses: 0, games: 0, sampleSize: 0,
}
const EMPTY_BUILD: ChampionBuild = {
  championId: '', patch: '', role: '', region: '',
  starterItems: [], coreItems: [], bootItems: [], popularBuilds: [],
  summonerSpells: [], skillOrder: { order: [], firstSkill: '', maxOrder: [] },
  sampleSize: 0,
}
const EMPTY_RUNES: RuneBuild = {
  championId: '', patch: '', role: '', region: '',
  primaryPath: { id: 0, key: '', name: '', iconUrl: '', slots: [] },
  primaryRunes: [],
  secondaryPath: { id: 0, key: '', name: '', iconUrl: '', slots: [] },
  secondaryRunes: [],
  shards: [],
  winRate: 0, pickRate: 0, games: 0, sampleSize: 0,
}
const EMPTY_COUNTERS: ChampionCounters = {
  championId: '', patch: '', role: '', region: '',
  countersWith: [], countersAgainst: [], sampleSize: 0,
}

export default function ChampionPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [role, setRole] = useState<Role | ''>('')
  const [tab, setTab] = useState<Tab>('Overview')

  const { data: champion, isLoading, error } = useQuery({
    queryKey: ['champion', id],
    queryFn: () => fetchChampion(id),
    enabled: !!id,
  })

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: ['champion', id, 'stats', role],
    queryFn: () => fetchChampionStats(id, role || undefined),
    enabled: !!id,
  })

  const { data: build = EMPTY_BUILD } = useQuery({
    queryKey: ['champion', id, 'builds', role],
    queryFn: () => fetchChampionBuilds(id, role || undefined),
    enabled: !!id && (tab === 'Overview' || tab === 'Builds'),
  })

  const { data: runes = EMPTY_RUNES } = useQuery({
    queryKey: ['champion', id, 'runes', role],
    queryFn: () => fetchChampionRunes(id, role || undefined),
    enabled: !!id && (tab === 'Overview' || tab === 'Runes'),
  })

  const { data: counters = EMPTY_COUNTERS } = useQuery({
    queryKey: ['champion', id, 'counters', role],
    queryFn: () => fetchChampionCounters(id, role || undefined),
    enabled: !!id && (tab === 'Overview' || tab === 'Counters'),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="py-40" />

  if (error || !champion) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 mb-4">Champion not found.</p>
        <Link to="/" className="btn-primary">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Splash art header */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={champion.splashUrl}
          alt={champion.name}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rift-dark via-rift-dark/60 to-transparent" />
        <div className="absolute inset-0 bg-dark-vignette" />

        {/* Back link */}
        <div className="absolute top-4 left-4">
          <Link to="/" className="flex items-center gap-1.5 text-gray-300 hover:text-gold-400 text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Champions
          </Link>
        </div>

        {/* Champion info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 flex items-end gap-4">
          <img
            src={champion.imageUrl}
            alt={champion.name}
            className="w-20 h-20 rounded-lg border-2 border-gold-500/60 shadow-gold shrink-0"
          />
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white text-shadow-gold">
              {champion.name}
            </h1>
            <p className="text-gray-300 text-sm capitalize mt-0.5">
              {champion.title}
            </p>
            <div className="flex gap-2 mt-2">
              {champion.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-rift-panel border border-rift-border text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Role selector + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 mr-1">Role:</span>
            <button
              className={clsx('role-btn', role === '' && 'role-btn-active')}
              onClick={() => setRole('')}
            >
              All
            </button>
            {ROLES.map((r) => (
              <button
                key={r.value}
                className={clsx('role-btn', role === r.value && 'role-btn-active')}
                onClick={() => setRole(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Tab bar */}
          <div className="sm:ml-auto flex border border-rift-border rounded overflow-hidden">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'px-4 py-1.5 text-sm font-medium transition-colors',
                  t === tab
                    ? 'bg-gold-500/20 text-gold-400 border-b-2 border-gold-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-rift-border/30'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats cards — always visible */}
        <StatsCards stats={stats} />

        {/* Tab content */}
        <div className="animate-fade-in">
          {(tab === 'Overview' || tab === 'Builds') && (
            <BuildSection build={build} />
          )}

          {(tab === 'Overview' || tab === 'Runes') && (
            <RunePage runes={runes} />
          )}

          {(tab === 'Overview' || tab === 'Counters') && (
            <CounterPicks counters={counters} />
          )}
        </div>

        {/* Champion description */}
        <div className="panel p-5">
          <div className="panel-header border-0 p-0 mb-3">
            <span className="panel-title">About {champion.name}</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">{champion.blurb}</p>
        </div>
      </div>
    </div>
  )
}
