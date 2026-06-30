import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart3, Hammer, Shield, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import {
  fetchChampion, fetchChampionStats, fetchChampionBuilds,
  fetchChampionRunes, fetchChampionCounters,
} from '../api/client'
import StatsCards from '../components/champion/StatsCards'
import BuildSection from '../components/champion/BuildSection'
import RunePage from '../components/champion/RunePage'
import CounterPicks from '../components/champion/CounterPicks'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Role, ChampionStats, ChampionBuild, RuneBuild, ChampionCounters } from '../types'

const ROLES: { value: Role; label: string; short: string }[] = [
  { value: 'TOP', label: 'Top', short: 'TOP' },
  { value: 'JUNGLE', label: 'Jungle', short: 'JNG' },
  { value: 'MIDDLE', label: 'Mid', short: 'MID' },
  { value: 'BOTTOM', label: 'Bot', short: 'BOT' },
  { value: 'UTILITY', label: 'Support', short: 'SUP' },
]

const TABS = [
  { value: 'Overview', icon: BarChart3 },
  { value: 'Builds', icon: Hammer },
  { value: 'Runes', icon: Sparkles },
  { value: 'Counters', icon: Shield },
] as const
type Tab = typeof TABS[number]['value']

const EMPTY_STATS: ChampionStats = { championId:'',patch:'',role:'',region:'',winRate:0,pickRate:0,banRate:0,wins:0,losses:0,games:0,sampleSize:0 }
const EMPTY_BUILD: ChampionBuild = { championId:'',patch:'',role:'',region:'',starterItems:[],coreItems:[],bootItems:[],popularBuilds:[],summonerSpells:[],skillOrder:{order:[],firstSkill:'',maxOrder:[]},sampleSize:0 }
const EMPTY_RUNES: RuneBuild = { championId:'',patch:'',role:'',region:'',primaryPath:{id:0,key:'',name:'',iconUrl:'',slots:[]},primaryRunes:[],secondaryPath:{id:0,key:'',name:'',iconUrl:'',slots:[]},secondaryRunes:[],shards:[],winRate:0,pickRate:0,games:0,sampleSize:0 }
const EMPTY_COUNTERS: ChampionCounters = { championId:'',patch:'',role:'',region:'',countersWith:[],countersAgainst:[],sampleSize:0 }

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
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

  const { data: stats = EMPTY_STATS } = useQuery({ queryKey:['champion',id,'stats',role], queryFn:()=>fetchChampionStats(id,role||undefined), enabled:!!id })
  const { data: build = EMPTY_BUILD } = useQuery({ queryKey:['champion',id,'builds',role], queryFn:()=>fetchChampionBuilds(id,role||undefined), enabled:!!id&&(tab==='Overview'||tab==='Builds') })
  const { data: runes = EMPTY_RUNES } = useQuery({ queryKey:['champion',id,'runes',role], queryFn:()=>fetchChampionRunes(id,role||undefined), enabled:!!id&&(tab==='Overview'||tab==='Runes') })
  const { data: counters = EMPTY_COUNTERS } = useQuery({ queryKey:['champion',id,'counters',role], queryFn:()=>fetchChampionCounters(id,role||undefined), enabled:!!id&&(tab==='Overview'||tab==='Counters') })

  if (isLoading) return <div className="rift-bg pt-32"><LoadingSpinner size="lg" /></div>
  if (error || !champion) return (
    <div className="rift-bg flex min-h-screen items-center justify-center px-4 text-center">
      <div className="rift-panel-gold p-8">
        <p className="mb-4 text-slate-400">Champion not found.</p>
        <Link to="/" className="btn-primary">Back to Meta</Link>
      </div>
    </div>
  )

  const patchLabel = stats.patch || champion.version?.split('.').slice(0, 2).join('.')
  const hasStats = stats.sampleSize > 0
  const roleLabel = role ? ROLES.find(item => item.value === role)?.label : 'All Roles'

  return (
    <div className="rift-bg animate-fade-in">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={champion.splashUrl}
            alt={champion.name}
            className="h-full w-full object-cover object-top"
            style={{ filter: 'saturate(1.12) contrast(1.04)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050810] via-[#050810]/70 to-[#050810]/24" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/20 to-transparent" />
        </div>

        <div className="rift-shell relative flex min-h-[520px] flex-col justify-end pb-8 pt-24">
          <Link to="/" className="btn-ghost absolute left-4 top-24 sm:left-6 lg:left-8">
            <ArrowLeft className="h-4 w-4" />
            Champions
          </Link>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <img
                src={champion.imageUrl}
                alt={champion.name}
                className="h-24 w-24 rounded-lg border-2 border-gold-400/45 object-cover shadow-2xl"
              />
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {patchLabel && <span className="stat-chip text-gold-300">Patch {patchLabel}</span>}
                  <span className="stat-chip text-slate-300">{roleLabel}</span>
                  {champion.tags?.map(tag => <span key={tag} className="stat-chip text-slate-400">{tag}</span>)}
                </div>
                <h1 className="font-display text-5xl font-black leading-none text-white text-glow-gold sm:text-7xl">
                  {champion.name}
                </h1>
                <p className="mt-3 max-w-2xl text-base capitalize leading-7 text-slate-300">{champion.title}</p>
              </div>
            </div>

            <div className="rift-panel-gold p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-mono text-xl font-black text-emerald-300">{hasStats ? pct(stats.winRate) : '-'}</div>
                  <div className="text-xs font-bold uppercase text-slate-600">Win</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-black text-blue-300">{hasStats ? pct(stats.pickRate) : '-'}</div>
                  <div className="text-xs font-bold uppercase text-slate-600">Pick</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-black text-red-300">{hasStats ? pct(stats.banRate) : '-'}</div>
                  <div className="text-xs font-bold uppercase text-slate-600">Ban</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rift-shell py-6">
        <div className="sticky top-16 z-30 -mx-4 mb-5 border-y border-white/[0.06] bg-[#050810]/92 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              <button onClick={() => setRole('')} className={clsx('role-btn shrink-0', role === '' && 'role-btn-active')}>ALL</button>
              {ROLES.map(r => (
                <button key={r.value} onClick={() => setRole(r.value)} className={clsx('role-btn shrink-0', role === r.value && 'role-btn-active')}>
                  {r.short}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {TABS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={clsx('role-btn shrink-0', tab === value && 'role-btn-active')}
                >
                  <Icon className="h-4 w-4" />
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <StatsCards stats={stats} />

          <div className="animate-fade-in space-y-5">
            {(tab === 'Overview' || tab === 'Builds') && <BuildSection build={build} />}
            {(tab === 'Overview' || tab === 'Runes') && <RunePage runes={runes} />}
            {(tab === 'Overview' || tab === 'Counters') && <CounterPicks counters={counters} />}
          </div>

          <div className="rift-panel p-5">
            <div className="rift-section-title mb-3">About {champion.name}</div>
            <p className="text-sm leading-7 text-slate-500">{champion.blurb}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
