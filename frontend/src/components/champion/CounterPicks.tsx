import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ChampionCounters, Counter } from '../../types'
import EmptyState from './EmptyState'

interface Props { counters: ChampionCounters }

function winColor(wr: number) {
  if (wr >= 0.55) return '#34d399'
  if (wr >= 0.50) return '#9ca3af'
  return '#f87171'
}

function CounterList({
  title, counters, icon: Icon, color,
}: { title: string; counters: Counter[]; icon: typeof TrendingUp; color: string }) {
  return (
    <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="panel-header">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="panel-title">{title}</span>
      </div>

      {!counters.length ? (
        <EmptyState message="Counter data is being collected." showTrigger={false} />
      ) : (
        <div>
          {counters.slice(0, 8).map((c, i) => {
            const name = c.champion?.name ?? c.championId
            const wr   = (c.winRate * 100).toFixed(1)
            return (
              <Link
                key={c.championId}
                to={`/champion/${c.championId}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors group"
                style={{ borderBottom: i < Math.min(counters.length, 8) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
              >
                {c.champion?.imageUrl ? (
                  <img src={c.champion.imageUrl} alt={name}
                       className="w-8 h-8 rounded-lg object-cover border border-white/10 group-hover:border-white/20 transition-colors shrink-0" loading="lazy" />
                ) : (
                  <div className="w-8 h-8 rounded-lg border border-white/10 bg-surface-2 flex items-center justify-center text-xs text-gray-600 shrink-0">{name[0]}</div>
                )}
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors flex-1 truncate">{name}</span>
                <span className="text-xs font-mono font-semibold shrink-0" style={{ color: winColor(c.winRate) }}>{wr}%</span>
                <span className="text-xs text-gray-700 font-mono shrink-0 hidden sm:block">{c.games.toLocaleString()}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CounterPicks({ counters }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-3">
      <CounterList title="Strong Against" counters={counters.countersWith ?? []}    icon={TrendingUp}   color="#34d399" />
      <CounterList title="Weak Against"   counters={counters.countersAgainst ?? []} icon={TrendingDown}  color="#f87171" />
    </div>
  )
}
