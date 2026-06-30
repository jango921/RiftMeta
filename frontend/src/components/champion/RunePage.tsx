import { HelpCircle, Sparkles } from 'lucide-react'
import type { RuneBuild, Rune } from '../../types'
import EmptyState from './EmptyState'

interface Props { runes: RuneBuild }

function RuneIcon({ rune, size = 'md' }: { rune: Rune; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-7 w-7' : 'h-11 w-11'
  return (
    <div className="group relative">
      {rune.imageUrl ? (
        <img src={rune.imageUrl} alt={rune.name} loading="lazy"
             className={`${sz} rounded-full border border-gold-400/30 bg-slate-950 p-0.5 transition duration-150 group-hover:scale-110 group-hover:border-gold-300/70`} />
      ) : (
        <div className={`${sz} flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03]`}>
          <HelpCircle className="h-3.5 w-3.5 text-slate-700" />
        </div>
      )}
      {rune.name && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
          <div className="whitespace-nowrap rounded-md border border-gold-400/20 bg-[#080d17]/98 px-2.5 py-1.5 text-xs font-bold text-gold-300 shadow-2xl backdrop-blur-xl">
            {rune.name}
          </div>
        </div>
      )}
    </div>
  )
}

function PathHeader({ icon, name, label, primary = false }: { icon?: string; name: string; label: string; primary?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon ? <img src={icon} alt={name} className="h-8 w-8" /> : <Sparkles className="h-5 w-5 text-slate-600" />}
      <div>
        <div className={primary ? 'text-sm font-black text-gold-300' : 'text-sm font-black text-slate-200'}>{name}</div>
        <div className="text-xs font-bold uppercase text-slate-600">{label}</div>
      </div>
    </div>
  )
}

export default function RunePage({ runes }: Props) {
  const hasData = runes.sampleSize > 0

  return (
    <div className="rift-panel">
      <div className="panel-header">
        <Sparkles className="h-4 w-4 text-gold-400" />
        <span className="panel-title">Rune Page</span>
        {hasData && (
          <div className="ml-auto flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="font-mono font-black text-emerald-300">{(runes.winRate * 100).toFixed(1)}% WR</span>
            <span>{runes.sampleSize.toLocaleString()} games</span>
          </div>
        )}
      </div>

      {!hasData ? (
        <EmptyState message="Rune data is being collected from ranked matches." showTrigger={false} />
      ) : (
        <div className="p-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_auto]">
            {runes.primaryPath?.name && (
              <div className="rounded-md border border-white/[0.07] bg-white/[0.025] p-4">
                <PathHeader icon={runes.primaryPath.iconUrl} name={runes.primaryPath.name} label="Primary Path" primary />
                <div className="flex flex-wrap gap-3">
                  {(runes.primaryRunes ?? []).map(r => <RuneIcon key={r.id} rune={r} />)}
                </div>
              </div>
            )}

            {runes.secondaryPath?.name && (
              <div className="rounded-md border border-white/[0.07] bg-white/[0.025] p-4">
                <PathHeader icon={runes.secondaryPath.iconUrl} name={runes.secondaryPath.name} label="Secondary Path" />
                <div className="flex flex-wrap gap-3">
                  {(runes.secondaryRunes ?? []).map(r => <RuneIcon key={r.id} rune={r} />)}
                </div>
              </div>
            )}

            {runes.shards?.length > 0 && (
              <div className="rounded-md border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="mb-4 text-xs font-black uppercase text-slate-600">Stat Shards</div>
                <div className="flex flex-wrap gap-2">
                  {runes.shards.map((s, i) => <RuneIcon key={i} rune={s} size="sm" />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
