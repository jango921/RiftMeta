import { Link } from 'react-router-dom'
import type { ChampionWithStats } from '../../types'

interface Props {
  title: string
  accent: string
  items: ChampionWithStats[]
  valueKey: 'winRate' | 'pickRate' | 'banRate'
}

export default function TopChampions({ title, accent, items, valueKey }: Props) {
  if (!items?.length) return (
    <div className="rounded-2xl p-5 h-full flex flex-col"
         style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="text-xs font-display text-gray-600 uppercase tracking-widest mb-4">{title}</div>
      <div className="flex-1 flex items-center justify-center text-xs text-gray-700">No data yet</div>
    </div>
  )

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
         style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="px-4 py-3.5 flex items-center justify-between"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-xs font-display uppercase tracking-widest" style={{ color: accent }}>{title}</span>
        <span className="text-xs text-gray-700">Patch data</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {items.slice(0, 8).map((entry, i) => {
          const val = (entry.stats[valueKey] * 100).toFixed(1) + '%'
          return (
            <Link
              key={entry.champion.id}
              to={`/champion/${entry.champion.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors group"
              style={{ borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
            >
              <span className="text-xs text-gray-700 w-4 text-right shrink-0 font-mono">{i + 1}</span>
              <img
                src={entry.champion.imageUrl}
                alt={entry.champion.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10 group-hover:border-white/20 transition-colors"
                loading="lazy"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1 truncate font-medium">
                {entry.champion.name}
              </span>
              <span className="text-xs font-semibold font-mono shrink-0" style={{ color: accent }}>
                {val}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
