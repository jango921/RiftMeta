import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { Champion, ChampionStats } from '../../types'

interface Props {
  champion: Champion
  stats?: ChampionStats
  size?: 'sm' | 'md' | 'lg'
  showStats?: boolean
  featured?: boolean
}

function winRateColor(wr: number) {
  if (wr >= 0.53) return '#34d399'
  if (wr >= 0.50) return '#f0c84d'
  if (wr >= 0.47) return '#cbd5e1'
  return '#f87171'
}

export default function ChampionCard({ champion, stats, size = 'md', showStats = true, featured = false }: Props) {
  if (size === 'sm') {
    return (
      <Link
        to={`/champion/${champion.id}`}
        className="group relative block overflow-hidden rounded-md border border-white/[0.07] bg-slate-950 transition duration-200 hover:-translate-y-0.5 hover:border-gold-300/40"
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={champion.splashUrl}
            alt={champion.name}
            className="h-full w-full scale-110 object-cover object-top transition duration-500 group-hover:scale-125"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/24 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2">
          <div className="truncate text-xs font-extrabold text-white transition group-hover:text-gold-300">
            {champion.name}
          </div>
          {showStats && stats && stats.sampleSize > 0 && (
            <div className="mt-0.5 font-mono text-[10px] font-bold" style={{ color: winRateColor(stats.winRate) }}>
              {(stats.winRate * 100).toFixed(1)}% WR
            </div>
          )}
        </div>
      </Link>
    )
  }

  if (featured) {
    return (
      <Link
        to={`/champion/${champion.id}`}
        className="group relative block min-h-[220px] overflow-hidden rounded-lg border border-white/[0.08] bg-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-gold-300/50"
      >
        <img
          src={champion.splashUrl}
          alt={champion.name}
          className="absolute inset-0 h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/58 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="font-display text-2xl font-black text-white text-glow-gold">{champion.name}</div>
          <div className="mt-1 truncate text-xs font-bold uppercase text-slate-400">{champion.tags?.join(' / ')}</div>
          {showStats && stats && stats.sampleSize > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="stat-chip" style={{ color: winRateColor(stats.winRate) }}>
                {(stats.winRate * 100).toFixed(1)}% WR
              </span>
              <span className="stat-chip text-slate-400">{(stats.pickRate * 100).toFixed(1)}% pick</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/champion/${champion.id}`}
      className="group rift-panel block transition duration-200 hover:-translate-y-1 hover:border-gold-300/35"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={champion.splashUrl}
          alt={champion.name}
          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/45 to-transparent" />
      </div>

      <div className={clsx('p-3', size === 'lg' && 'p-4')}>
        <div className="truncate text-sm font-extrabold text-slate-100 transition group-hover:text-gold-300">{champion.name}</div>
        <div className="mt-0.5 truncate text-xs font-semibold uppercase text-slate-600">{champion.tags?.join(' / ')}</div>
        {showStats && stats && stats.sampleSize > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-xs font-black" style={{ color: winRateColor(stats.winRate) }}>
              {(stats.winRate * 100).toFixed(1)}%
            </span>
            <span className="font-mono text-xs text-slate-500">{(stats.pickRate * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </Link>
  )
}
