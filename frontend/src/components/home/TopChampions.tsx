import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import type { ChampionWithStats } from '../../types'

interface Props {
  title: string
  accent: string
  items: ChampionWithStats[]
  valueKey: 'winRate' | 'pickRate' | 'banRate'
}

export default function TopChampions({ title, accent, items, valueKey }: Props) {
  if (!items?.length) {
    return (
      <div className="rift-panel flex min-h-[180px] flex-col p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
          <Trophy className="h-3.5 w-3.5" style={{ color: accent }} />
          {title}
        </div>
        <div className="flex flex-1 items-center justify-center text-xs text-slate-600">No data yet</div>
      </div>
    )
  }

  return (
    <div className="rift-panel flex h-full min-h-[260px] flex-col">
      <div className="panel-header">
        <Trophy className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="panel-title" style={{ color: accent }}>{title}</span>
        <span className="ml-auto text-xs text-slate-600">Top 8</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.slice(0, 8).map((entry, i) => {
          const val = `${(entry.stats[valueKey] * 100).toFixed(1)}%`
          return (
            <Link
              key={entry.champion.id}
              to={`/champion/${entry.champion.id}`}
              className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.035]"
              style={{ borderBottom: i < Math.min(items.length, 8) - 1 ? '1px solid rgba(255,255,255,0.055)' : 'none' }}
            >
              <span className="w-5 shrink-0 text-right font-mono text-xs font-black text-slate-600">{i + 1}</span>
              <img
                src={entry.champion.imageUrl}
                alt={entry.champion.name}
                className="h-9 w-9 shrink-0 rounded-md border border-white/10 object-cover transition group-hover:border-gold-300/50"
                loading="lazy"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-300 transition group-hover:text-white">
                {entry.champion.name}
              </span>
              <span className="shrink-0 font-mono text-xs font-black" style={{ color: accent }}>
                {val}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
