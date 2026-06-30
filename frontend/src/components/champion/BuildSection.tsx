import { ChevronRight, Package } from 'lucide-react'
import type { BuildSet, ChampionBuild, ItemBuild } from '../../types'
import EmptyState from './EmptyState'

interface Props { build: ChampionBuild }

function winColor(wr: number) {
  if (wr >= 0.53) return '#34d399'
  if (wr >= 0.50) return '#f0c84d'
  return '#f87171'
}

function WR({ value }: { value: number }) {
  return <span className="font-mono text-xs font-black" style={{ color: winColor(value) }}>{(value * 100).toFixed(1)}%</span>
}

function ItemIcon({ item, size = 'md' }: { item: ItemBuild; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  if (!item.item) return (
    <div className={`${dim} flex shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.035]`}>
      <Package className="h-4 w-4 text-slate-700" />
    </div>
  )
  return (
    <div className="group relative shrink-0">
      <img src={item.item.imageUrl} alt={item.item.name}
           className={`${dim} rounded-md border border-white/10 object-cover transition duration-150 group-hover:scale-110 group-hover:border-gold-300/45`} />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
        <div className="rounded-md border border-gold-400/20 bg-[#080d17]/98 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl">
          <div className="whitespace-nowrap font-bold text-gold-300">{item.item.name}</div>
          <div className="mt-0.5 text-slate-500">{item.item.gold.toLocaleString()}g</div>
          <div className="mt-0.5"><WR value={item.winRate} /> <span className="text-slate-600">WR</span></div>
        </div>
      </div>
    </div>
  )
}

function ItemStrip({ title, items }: { title: string; items: ItemBuild[] }) {
  if (!items?.length) return null
  return (
    <div className="rift-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="rift-section-title">{title}</div>
        <span className="text-xs text-slate-600">Most common</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {items.slice(0, 8).map((item, i) => (
          <div key={`${item.itemId}-${i}`} className="flex items-center gap-2">
            <ItemIcon item={item} />
            {i < Math.min(items.length, 8) - 1 && <ChevronRight className="h-4 w-4 text-slate-700" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function PopularBuild({ buildSet }: { buildSet: BuildSet }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-3">
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {buildSet.items.slice(0, 6).map((item, i) => (
          <ItemIcon key={`${item.itemId}-${i}`} item={item} size="sm" />
        ))}
      </div>
      <div className="text-right">
        <WR value={buildSet.winRate} />
        <div className="mt-1 font-mono text-xs text-slate-600">{buildSet.games.toLocaleString()} games</div>
      </div>
    </div>
  )
}

export default function BuildSection({ build }: Props) {
  const hasItems = build.coreItems?.length > 0

  return (
    <div className="space-y-4">
      {(build.summonerSpells?.length > 0 || build.skillOrder?.maxOrder?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {build.summonerSpells?.length > 0 && (
            <div className="rift-panel">
              <div className="panel-header"><span className="panel-title">Summoner Spells</span></div>
              <div className="grid gap-2 p-4 sm:grid-cols-3">
                {build.summonerSpells.slice(0, 3).map((ss, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-3">
                    <div className="flex gap-1.5">
                      {[ss.spell1, ss.spell2].map((spell, j) => (
                        spell.imageUrl
                          ? <img key={j} src={spell.imageUrl} alt={spell.name} className="h-9 w-9 rounded-md border border-white/10" />
                          : <div key={j} className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[10px] text-slate-600">{spell.id}</div>
                      ))}
                    </div>
                    <div>
                      <WR value={ss.winRate} />
                      <div className="mt-0.5 text-[10px] font-bold uppercase text-slate-600">{(ss.pickRate * 100).toFixed(0)}% pick</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {build.skillOrder?.maxOrder?.length > 0 && (
            <div className="rift-panel">
              <div className="panel-header"><span className="panel-title">Skill Max Order</span></div>
              <div className="flex flex-wrap items-center gap-2 p-4">
                {build.skillOrder.maxOrder.map((skill, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`skill-badge skill-${skill}`}>{skill}</span>
                    {i < build.skillOrder.maxOrder.length - 1 && <ChevronRight className="h-4 w-4 text-slate-700" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ItemStrip title="Starter Items" items={build.starterItems ?? []} />
        <ItemStrip title="Boot Options" items={build.bootItems ?? []} />
      </div>

      <div className="rift-panel">
        <div className="panel-header">
          <span className="panel-title">Core Items</span>
          {build.sampleSize > 0 && (
            <span className="ml-auto text-xs text-slate-600">{build.sampleSize.toLocaleString()} games</span>
          )}
        </div>

        {!hasItems ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                  {['#', 'Item', 'Win Rate', 'Pick Rate', 'Games'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-bold uppercase text-slate-600 ${i > 1 ? 'text-right' : i === 0 ? 'w-10 text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {build.coreItems.map((item, i) => (
                  <tr key={`${item.itemId}-${i}`} className="data-row">
                    <td className="px-4 py-3 text-center font-mono text-xs font-bold text-slate-600">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ItemIcon item={item} />
                        <span className="text-sm font-semibold text-slate-300">{item.item?.name ?? `Item ${item.itemId}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right"><WR value={item.winRate} /></td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">{(item.pickRate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{item.games.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {build.popularBuilds?.length > 0 && (
        <div className="rift-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="rift-section-title">Full Build Paths</div>
            <span className="text-xs text-slate-600">Top builds</span>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {build.popularBuilds.slice(0, 4).map((set, i) => <PopularBuild key={i} buildSet={set} />)}
          </div>
        </div>
      )}
    </div>
  )
}
