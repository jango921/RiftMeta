import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { Champion, ChampionStats } from '../../types'
import WinRateBadge from './WinRateBadge'

interface Props {
  champion: Champion
  stats?: ChampionStats
  size?: 'sm' | 'md'
  showStats?: boolean
}

export default function ChampionCard({ champion, stats, size = 'md', showStats = true }: Props) {
  return (
    <Link
      to={`/champion/${champion.id}`}
      className={clsx(
        'group panel hover:border-gold-500/40 transition-all duration-200 hover:shadow-gold overflow-hidden block',
        size === 'sm' ? 'rounded' : 'rounded-lg'
      )}
    >
      {/* Icon */}
      <div className="relative">
        <img
          src={champion.imageUrl}
          alt={champion.name}
          className={clsx(
            'w-full object-cover',
            size === 'sm' ? 'h-14' : 'h-20'
          )}
          style={{ objectPosition: 'top center' }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rift-panel via-transparent to-transparent opacity-60" />
      </div>

      {/* Info */}
      <div className={clsx('p-2', size === 'sm' ? 'px-2 py-1.5' : 'p-3')}>
        <div className="font-semibold text-gray-100 text-sm truncate group-hover:text-gold-400 transition-colors">
          {champion.name}
        </div>
        {size === 'md' && (
          <div className="text-xs text-gray-500 truncate capitalize">{champion.tags?.join(' · ')}</div>
        )}
        {showStats && stats && stats.sampleSize > 0 && (
          <div className="mt-1.5 flex items-center justify-between">
            <WinRateBadge value={stats.winRate} size="sm" />
            <span className="text-xs text-gray-500">{(stats.pickRate * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </Link>
  )
}
