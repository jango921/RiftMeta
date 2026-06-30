import { Link } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { ChampionCounters, Counter } from '../../types'
import EmptyState from './EmptyState'

interface Props { counters: ChampionCounters }

function winColor(wr: number) {
  if (wr >= 0.55) return '#34d399'
  if (wr >= 0.50) return '#cbd5e1'
  return '#f87171'
}

function CounterList({
  title, counters, icon: Icon, color, caption,
}: { title: string; counters: Counter[]; icon: typeof TrendingUp; color: string; caption: string }) {
  return (
    <div className="rift-panel flex-1">
      <div className="panel-header">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="panel-title">{title}</span>
        <span className="ml-auto hidden text-xs text-slate-600 sm:inline">{caption}</span>
      </div>

      {!counters.length ? (
        <EmptyState message="Counter data is being collected." showTrigger={false} />
      ) : (
        <div className="divide-y divide-white/[0.055]">
          {counters.slice(0, 8).map((c, i) => {
            const name = c.champion?.name ?? c.championId
            return (
              <Link
                key={`${c.championId}-${i}`}
                to={`/champion/${c.championId}`}
                className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.035]"
              >
                <span className="w-5 text-right font-mono text-xs font-black text-slate-600">{i + 1}</span>
                <div className="flex min-w-0 items-center gap-3">
                  {c.champion?.imageUrl ? (
                    <img src={c.champion.imageUrl} alt={name}
                         className="h-9 w-9 shrink-0 rounded-md border border-white/10 object-cover transition group-hover:border-gold-300/45" loading="lazy" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-600">{name[0]}</div>
                  )}
                  <span className="truncate text-sm font-bold text-slate-300 transition group-hover:text-white">{name}</span>
                </div>
                <span className="font-mono text-xs font-black" style={{ color: winColor(c.winRate) }}>{(c.winRate * 100).toFixed(1)}%</span>
                <span className="hidden font-mono text-xs text-slate-600 sm:block">{c.games.toLocaleString()}</span>
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CounterList title="Strong Against" counters={counters.countersWith ?? []} icon={TrendingUp} color="#34d399" caption="Best matchups" />
      <CounterList title="Weak Against" counters={counters.countersAgainst ?? []} icon={TrendingDown} color="#f87171" caption="Ban or prepare" />
    </div>
  )
}
