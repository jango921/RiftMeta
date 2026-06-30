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
  if (wr >= 0.50) return '#fbbf24'
  if (wr >= 0.47) return '#9ca3af'
  return '#f87171'
}

export default function ChampionCard({ champion, stats, size = 'md', showStats = true, featured = false }: Props) {
  if (size === 'sm') {
    return (
      <Link
        to={`/champion/${champion.id}`}
        className="group relative rounded-xl overflow-hidden block transition-all duration-300 hover:-translate-y-0.5"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Splash thumbnail */}
        <div className="relative aspect-square overflow-hidden bg-surface-2">
          <img
            src={champion.splashUrl}
            alt={champion.name}
            className="w-full h-full object-cover object-top scale-110 transition-transform duration-500 group-hover:scale-125"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,12,20,0.95) 0%, rgba(8,12,20,0.1) 60%)' }} />
        </div>

        {/* Name */}
        <div className="absolute bottom-0 inset-x-0 px-2 pb-2">
          <div className="text-xs font-semibold text-white/90 truncate group-hover:text-gold-400 transition-colors">
            {champion.name}
          </div>
          {showStats && stats && stats.sampleSize > 0 && (
            <div className="text-[10px] font-mono mt-0.5" style={{ color: winRateColor(stats.winRate) }}>
              {(stats.winRate * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
             style={{ boxShadow: '0 0 0 1px rgba(200,155,60,0.2) inset' }} />
      </Link>
    )
  }

  if (featured) {
    return (
      <Link
        to={`/champion/${champion.id}`}
        className="group relative rounded-3xl overflow-hidden block h-full transition-all duration-500 hover:-translate-y-1"
        style={{ border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      >
        <img
          src={champion.splashUrl}
          alt={champion.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,12,20,1) 0%, rgba(8,12,20,0.5) 40%, transparent 70%)' }} />

        <div className="absolute bottom-0 inset-x-0 p-5">
          <div className="font-display text-xl font-bold text-white text-glow-gold mb-1">{champion.name}</div>
          <div className="text-sm text-gray-400 capitalize mb-3">{champion.title}</div>
          {showStats && stats && stats.sampleSize > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                {(stats.winRate * 100).toFixed(1)}% WR
              </span>
              <span className="text-xs text-gray-500">{(stats.pickRate * 100).toFixed(1)}% pick</span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
             style={{ boxShadow: '0 0 0 1px rgba(200,155,60,0.25) inset, 0 0 40px rgba(200,155,60,0.08)' }} />
      </Link>
    )
  }

  return (
    <Link
      to={`/champion/${champion.id}`}
      className="group relative rounded-2xl overflow-hidden block transition-all duration-300 hover:-translate-y-1"
      style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(17,24,39,0.5)' }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <img
          src={champion.splashUrl}
          alt={champion.name}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(17,24,39,1) 0%, rgba(17,24,39,0.4) 50%, transparent 100%)' }} />
      </div>

      <div className={clsx('p-3', size === 'lg' && 'p-4')}>
        <div className="font-semibold text-gray-100 text-sm truncate group-hover:text-gold-400 transition-colors">{champion.name}</div>
        <div className="text-xs text-gray-600 truncate mt-0.5">{champion.tags?.join(' · ')}</div>
        {showStats && stats && stats.sampleSize > 0 && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold font-mono" style={{ color: winRateColor(stats.winRate) }}>
              {(stats.winRate * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-600">{(stats.pickRate * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ boxShadow: '0 0 0 1px rgba(200,155,60,0.15) inset' }} />
    </Link>
  )
}
