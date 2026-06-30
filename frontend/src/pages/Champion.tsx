import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
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

const ROLES: { value: Role; label: string }[] = [
  { value: 'TOP',     label: 'Top' },
  { value: 'JUNGLE',  label: 'Jungle' },
  { value: 'MIDDLE',  label: 'Mid' },
  { value: 'BOTTOM',  label: 'Bot' },
  { value: 'UTILITY', label: 'Support' },
]

const TABS = ['Overview', 'Builds', 'Runes', 'Counters'] as const
type Tab = typeof TABS[number]

const EMPTY_STATS: ChampionStats       = { championId:'',patch:'',role:'',region:'',winRate:0,pickRate:0,banRate:0,wins:0,losses:0,games:0,sampleSize:0 }
const EMPTY_BUILD: ChampionBuild       = { championId:'',patch:'',role:'',region:'',starterItems:[],coreItems:[],bootItems:[],popularBuilds:[],summonerSpells:[],skillOrder:{order:[],firstSkill:'',maxOrder:[]},sampleSize:0 }
const EMPTY_RUNES: RuneBuild           = { championId:'',patch:'',role:'',region:'',primaryPath:{id:0,key:'',name:'',iconUrl:'',slots:[]},primaryRunes:[],secondaryPath:{id:0,key:'',name:'',iconUrl:'',slots:[]},secondaryRunes:[],shards:[],winRate:0,pickRate:0,games:0,sampleSize:0 }
const EMPTY_COUNTERS: ChampionCounters = { championId:'',patch:'',role:'',region:'',countersWith:[],countersAgainst:[],sampleSize:0 }

export default function ChampionPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [role, setRole] = useState<Role | ''>('')
  const [tab, setTab] = useState<Tab>('Overview')

  const { data: champion, isLoading, error } = useQuery({
    queryKey: ['champion', id],
    queryFn: () => fetchChampion(id),
    enabled: !!id,
  })

  const { data: stats    = EMPTY_STATS }    = useQuery({ queryKey:['champion',id,'stats',role],    queryFn:()=>fetchChampionStats(id,role||undefined),    enabled:!!id })
  const { data: build    = EMPTY_BUILD }    = useQuery({ queryKey:['champion',id,'builds',role],   queryFn:()=>fetchChampionBuilds(id,role||undefined),   enabled:!!id&&(tab==='Overview'||tab==='Builds') })
  const { data: runes    = EMPTY_RUNES }    = useQuery({ queryKey:['champion',id,'runes',role],    queryFn:()=>fetchChampionRunes(id,role||undefined),    enabled:!!id&&(tab==='Overview'||tab==='Runes') })
  const { data: counters = EMPTY_COUNTERS } = useQuery({ queryKey:['champion',id,'counters',role], queryFn:()=>fetchChampionCounters(id,role||undefined), enabled:!!id&&(tab==='Overview'||tab==='Counters') })

  if (isLoading) return <LoadingSpinner size="lg" className="pt-40" />
  if (error || !champion) return (
    <div className="max-w-7xl mx-auto px-4 pt-32 text-center">
      <p className="text-gray-500 mb-4">Champion not found.</p>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  )

  const patchLabel = stats.patch || champion.version?.split('.').slice(0, 2).join('.')

  return (
    <div className="animate-fade-in" style={{ background: '#080C14', minHeight: '100vh' }}>

      {/* ---- Splash header ---- */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {/* Splash art */}
        <img
          src={champion.splashUrl}
          alt={champion.name}
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ filter: 'saturate(1.1)' }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(8,12,20,0.9) 0%, rgba(8,12,20,0.4) 50%, rgba(8,12,20,0.2) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #080C14 0%, transparent 50%)' }} />

        {/* Back */}
        <div className="absolute top-16 left-4 sm:left-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Champions
          </Link>
        </div>

        {/* Champion info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 flex items-end gap-5">
          <img
            src={champion.imageUrl}
            alt={champion.name}
            className="w-20 h-20 rounded-2xl border-2 shrink-0"
            style={{ borderColor: 'rgba(200,155,60,0.5)', boxShadow: '0 0 24px rgba(200,155,60,0.2)' }}
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl sm:text-4xl font-black text-white text-glow-gold tracking-tight">
                {champion.name}
              </h1>
              {patchLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.2)', color: '#C89B3C' }}>
                  {patchLabel}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm capitalize">{champion.title}</p>
            <div className="flex gap-2 mt-2">
              {champion.tags?.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full text-gray-500"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Role selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-600 mr-1">Role</span>
            <button onClick={() => setRole('')} className={clsx('role-btn', role === '' && 'role-btn-active')}>All</button>
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} className={clsx('role-btn', role === r.value && 'role-btn-active')}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Tab bar */}
          <div className="sm:ml-auto flex rounded-xl overflow-hidden p-0.5"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
                style={t === tab
                  ? { background: 'rgba(200,155,60,0.12)', color: '#C89B3C', boxShadow: '0 0 0 1px rgba(200,155,60,0.2)' }
                  : { color: 'rgba(107,114,128,1)' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <StatsCards stats={stats} />

        {/* Tab content */}
        <div className="animate-fade-in space-y-4">
          {(tab === 'Overview' || tab === 'Builds')   && <BuildSection build={build} />}
          {(tab === 'Overview' || tab === 'Runes')    && <RunePage runes={runes} />}
          {(tab === 'Overview' || tab === 'Counters') && <CounterPicks counters={counters} />}
        </div>

        {/* About */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(17,24,39,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-xs font-display uppercase tracking-widest text-gray-600 mb-3">About {champion.name}</div>
          <p className="text-gray-500 text-sm leading-relaxed">{champion.blurb}</p>
        </div>
      </div>
    </div>
  )
}
