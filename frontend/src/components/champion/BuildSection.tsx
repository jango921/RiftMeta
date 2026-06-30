import { Package } from 'lucide-react'
import type { ChampionBuild, ItemBuild } from '../../types'
import WinRateBadge from '../common/WinRateBadge'
import EmptyState from './EmptyState'

interface Props {
  build: ChampionBuild
}

function ItemIcon({ item }: { item: ItemBuild }) {
  if (!item.item) {
    return (
      <div className="w-10 h-10 rounded border border-rift-border bg-rift-dark flex items-center justify-center">
        <Package className="w-4 h-4 text-gray-600" />
      </div>
    )
  }

  return (
    <div className="group relative">
      <img
        src={item.item.imageUrl}
        alt={item.item.name}
        className="w-10 h-10 rounded border border-rift-border hover:border-gold-500/60 transition-colors"
        loading="lazy"
      />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 min-w-max">
        <div className="panel px-3 py-2 text-xs">
          <div className="font-semibold text-gold-400">{item.item.name}</div>
          <div className="text-gray-400">{item.item.gold.toLocaleString()}g</div>
          <div className="text-emerald-400">{(item.winRate * 100).toFixed(1)}% WR</div>
        </div>
      </div>
    </div>
  )
}

function ItemRow({ item, rank }: { item: ItemBuild; rank: number }) {
  return (
    <tr className="border-b border-rift-border/50 hover:bg-rift-border/20 transition-colors">
      <td className="py-2.5 px-4 text-gray-500 text-sm w-8">{rank}</td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-3">
          <ItemIcon item={item} />
          <span className="text-sm text-gray-200">{item.item?.name ?? `Item ${item.itemId}`}</span>
        </div>
      </td>
      <td className="py-2.5 px-4 text-right">
        <WinRateBadge value={item.winRate} size="sm" />
      </td>
      <td className="py-2.5 px-4 text-right text-sm text-gray-400">
        {(item.pickRate * 100).toFixed(1)}%
      </td>
      <td className="py-2.5 px-4 text-right text-sm text-gray-500">
        {item.games.toLocaleString()}
      </td>
    </tr>
  )
}

export default function BuildSection({ build }: Props) {
  const hasItems = build.coreItems && build.coreItems.length > 0

  return (
    <div className="space-y-4">
      {/* Summoner Spells */}
      {build.summonerSpells && build.summonerSpells.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Summoner Spells</span>
          </div>
          <div className="p-4 flex flex-wrap gap-4">
            {build.summonerSpells.slice(0, 3).map((ss, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex gap-1">
                  {ss.spell1.imageUrl ? (
                    <img src={ss.spell1.imageUrl} alt={ss.spell1.name} className="w-9 h-9 rounded border border-rift-border" />
                  ) : (
                    <div className="w-9 h-9 rounded border border-rift-border bg-rift-dark flex items-center justify-center text-xs text-gray-500">{ss.spell1.id}</div>
                  )}
                  {ss.spell2.imageUrl ? (
                    <img src={ss.spell2.imageUrl} alt={ss.spell2.name} className="w-9 h-9 rounded border border-rift-border" />
                  ) : (
                    <div className="w-9 h-9 rounded border border-rift-border bg-rift-dark flex items-center justify-center text-xs text-gray-500">{ss.spell2.id}</div>
                  )}
                </div>
                <div>
                  <WinRateBadge value={ss.winRate} size="sm" />
                  <div className="text-xs text-gray-500">{(ss.pickRate * 100).toFixed(0)}% pick</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Order */}
      {build.skillOrder?.maxOrder && build.skillOrder.maxOrder.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Skill Max Order</span>
          </div>
          <div className="p-4 flex items-center gap-3">
            <span className="text-xs text-gray-500 shrink-0">Max First</span>
            <div className="flex items-center gap-2">
              {build.skillOrder.maxOrder.map((skill, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className={`skill-badge skill-${skill}`}>{skill}</span>
                  {i < build.skillOrder.maxOrder.length - 1 && (
                    <span className="text-gray-600 text-xs">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Core Items */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Core Items</span>
          {build.sampleSize > 0 && (
            <span className="ml-auto text-xs text-gray-500">{build.sampleSize.toLocaleString()} games</span>
          )}
        </div>

        {!hasItems ? (
          <EmptyState message="Build data is being collected. Check back after the worker processes more matches." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rift-border">
                  <th className="py-2 px-4 text-left text-xs text-gray-500 font-medium w-8">#</th>
                  <th className="py-2 px-4 text-left text-xs text-gray-500 font-medium">Item</th>
                  <th className="py-2 px-4 text-right text-xs text-gray-500 font-medium">Win Rate</th>
                  <th className="py-2 px-4 text-right text-xs text-gray-500 font-medium">Pick Rate</th>
                  <th className="py-2 px-4 text-right text-xs text-gray-500 font-medium">Games</th>
                </tr>
              </thead>
              <tbody>
                {build.coreItems.map((item, i) => (
                  <ItemRow key={item.itemId} item={item} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
