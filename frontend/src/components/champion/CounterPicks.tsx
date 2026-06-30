import { Link } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { ChampionCounters, Counter } from '../../types'
import WinRateBadge from '../common/WinRateBadge'
import EmptyState from './EmptyState'

interface Props {
  counters: ChampionCounters
}

function CounterRow({ counter }: { counter: Counter }) {
  const name = counter.champion?.name ?? counter.championId
  const imageUrl = counter.champion?.imageUrl

  return (
    <tr className="border-b border-rift-border/50 hover:bg-rift-border/20 transition-colors">
      <td className="py-2.5 px-4">
        <Link
          to={`/champion/${counter.championId}`}
          className="flex items-center gap-3 group"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-8 h-8 rounded border border-rift-border group-hover:border-gold-500/50 transition-colors"
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 rounded border border-rift-border bg-rift-dark flex items-center justify-center text-xs text-gray-500">
              {name[0]}
            </div>
          )}
          <span className="text-sm text-gray-200 group-hover:text-gold-400 transition-colors">
            {name}
          </span>
        </Link>
      </td>
      <td className="py-2.5 px-4 text-right">
        <WinRateBadge value={counter.winRate} size="sm" />
      </td>
      <td className="py-2.5 px-4 text-right text-sm text-gray-500">
        {counter.games.toLocaleString()}
      </td>
    </tr>
  )
}

function CounterTable({
  title,
  counters,
  icon: Icon,
  iconColor,
}: {
  title: string
  counters: Counter[]
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}) {
  return (
    <div className="flex-1 panel">
      <div className="panel-header">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="panel-title">{title}</span>
      </div>
      {counters.length === 0 ? (
        <EmptyState message="Counter data is being collected." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rift-border">
                <th className="py-2 px-4 text-left text-xs text-gray-500 font-medium">Champion</th>
                <th className="py-2 px-4 text-right text-xs text-gray-500 font-medium">Win Rate</th>
                <th className="py-2 px-4 text-right text-xs text-gray-500 font-medium">Games</th>
              </tr>
            </thead>
            <tbody>
              {counters.slice(0, 10).map((c) => (
                <CounterRow key={c.championId} counter={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function CounterPicks({ counters }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <CounterTable
        title="Strong Against"
        counters={counters.countersWith ?? []}
        icon={TrendingUp}
        iconColor="text-emerald-400"
      />
      <CounterTable
        title="Weak Against"
        counters={counters.countersAgainst ?? []}
        icon={TrendingDown}
        iconColor="text-red-400"
      />
    </div>
  )
}
