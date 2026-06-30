import { Package } from 'lucide-react'
import type { ChampionBuild, ItemBuild } from '../../types'
import EmptyState from './EmptyState'

interface Props { build: ChampionBuild }

function winColor(wr: number) {
  if (wr >= 0.53) return '#34d399'
  if (wr >= 0.50) return '#fbbf24'
  return '#f87171'
}

function ItemIcon({ item }: { item: ItemBuild }) {
  if (!item.item) return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Package className="w-4 h-4 text-gray-700" />
    </div>
  )
  return (
    <div className="relative group shrink-0">
      <img src={item.item.imageUrl} alt={item.item.name}
           className="w-10 h-10 rounded-xl object-cover transition-transform duration-200 group-hover:scale-110"
           style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="rounded-xl px-3 py-2 text-xs whitespace-nowrap"
             style={{ background: 'rgba(13,17,23,0.98)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div className="font-semibold text-gold-400 mb-0.5">{item.item.name}</div>
          <div className="text-gray-500">{item.item.gold.toLocaleString()}g</div>
          <div className="font-mono" style={{ color: winColor(item.winRate) }}>{(item.winRate * 100).toFixed(1)}% WR</div>
        </div>
      </div>
    </div>
  )
}

function WR({ value }: { value: number }) {
  return <span className="font-mono text-xs font-semibold" style={{ color: winColor(value) }}>{(value * 100).toFixed(1)}%</span>
}

export default function BuildSection({ build }: Props) {
  const hasItems = build.coreItems?.length > 0

  return (
    <div className="space-y-3">

      {/* Spells + Skill order row */}
      {(build.summonerSpells?.length > 0 || build.skillOrder?.maxOrder?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {build.summonerSpells?.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="panel-header"><span className="panel-title">Summoner Spells</span></div>
              <div className="p-4 flex flex-wrap gap-4">
                {build.summonerSpells.slice(0, 3).map((ss, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      {[ss.spell1, ss.spell2].map((spell, j) => (
                        spell.imageUrl
                          ? <img key={j} src={spell.imageUrl} alt={spell.name} className="w-9 h-9 rounded-xl border border-white/10" />
                          : <div key={j} className="w-9 h-9 rounded-xl border border-white/10 bg-surface-2 flex items-center justify-center text-[10px] text-gray-600">{spell.id}</div>
                      ))}
                    </div>
                    <div>
                      <WR value={ss.winRate} />
                      <div className="text-[10px] text-gray-600 mt-0.5">{(ss.pickRate * 100).toFixed(0)}% pick</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {build.skillOrder?.maxOrder?.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="panel-header"><span className="panel-title">Skill Max Order</span></div>
              <div className="p-4 flex items-center gap-2">
                <span className="text-xs text-gray-600 shrink-0">Max</span>
                <div className="flex items-center gap-2">
                  {build.skillOrder.maxOrder.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`skill-badge skill-${skill}`}>{skill}</span>
                      {i < build.skillOrder.maxOrder.length - 1 && (
                        <span className="text-gray-700 text-xs">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Core items table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="panel-header">
          <span className="panel-title">Core Items</span>
          {build.sampleSize > 0 && (
            <span className="ml-auto text-xs text-gray-700">{build.sampleSize.toLocaleString()} games</span>
          )}
        </div>

        {!hasItems ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['#', 'Item', 'Win Rate', 'Pick Rate', 'Games'].map((h, i) => (
                    <th key={h} className={`py-2.5 px-4 text-xs text-gray-600 font-medium ${i > 1 ? 'text-right' : i === 0 ? 'w-8' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {build.coreItems.map((item, i) => (
                  <tr key={item.itemId} className="data-row">
                    <td className="py-3 px-4 text-xs text-gray-700 font-mono">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <ItemIcon item={item} />
                        <span className="text-sm text-gray-300">{item.item?.name ?? `Item ${item.itemId}`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right"><WR value={item.winRate} /></td>
                    <td className="py-3 px-4 text-right text-xs text-gray-500 font-mono">{(item.pickRate * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right text-xs text-gray-700 font-mono">{item.games.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
