import { Link } from 'react-router-dom'
import type { ChampionWithStats } from '../../types'
import WinRateBadge from '../common/WinRateBadge'

interface Props {
  title: string
  items: ChampionWithStats[]
}

export default function TopChampions({ title, items }: Props) {
  if (!items || items.length === 0) return null

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
      </div>
      <div className="p-3">
        <div className="space-y-1">
          {items.slice(0, 10).map((entry, i) => (
            <Link
              key={entry.champion.id}
              to={`/champion/${entry.champion.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-rift-border/40 transition-colors group"
            >
              <span className="text-gray-600 text-xs w-4 text-right shrink-0">{i + 1}</span>
              <img
                src={entry.champion.imageUrl}
                alt={entry.champion.name}
                className="w-7 h-7 rounded border border-rift-border group-hover:border-gold-500/50 transition-colors shrink-0"
                loading="lazy"
              />
              <span className="text-sm text-gray-200 group-hover:text-gold-400 transition-colors flex-1 truncate">
                {entry.champion.name}
              </span>
              <div className="text-right shrink-0">
                <WinRateBadge value={entry.stats.winRate} size="sm" />
                <div className="text-xs text-gray-600">{(entry.stats.pickRate * 100).toFixed(1)}%</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
