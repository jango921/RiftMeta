import { HelpCircle } from 'lucide-react'
import type { RuneBuild, Rune } from '../../types'
import EmptyState from './EmptyState'

interface Props { runes: RuneBuild }

function RuneIcon({ rune, size = 'md', active = true }: { rune: Rune; size?: 'sm' | 'md'; active?: boolean }) {
  const sz = size === 'sm' ? 'w-6 h-6' : 'w-10 h-10'
  return (
    <div className="group relative">
      {rune.imageUrl ? (
        <img src={rune.imageUrl} alt={rune.name} loading="lazy"
             className={`${sz} rounded-full transition-all duration-200 ${active ? 'opacity-100' : 'opacity-25 grayscale'}`}
             style={{ border: active ? '1px solid rgba(200,155,60,0.3)' : '1px solid rgba(255,255,255,0.06)' }} />
      ) : (
        <div className={`${sz} rounded-full border border-white/10 bg-surface-2 flex items-center justify-center`}>
          <HelpCircle className="w-3 h-3 text-gray-700" />
        </div>
      )}
      {rune.name && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
          <div className="rounded-xl px-2.5 py-1.5 text-xs whitespace-nowrap"
               style={{ background: 'rgba(13,17,23,0.98)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <div className="font-semibold text-gold-400">{rune.name}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RunePage({ runes }: Props) {
  const hasData = runes.sampleSize > 0

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="panel-header">
        <span className="panel-title">Rune Page</span>
        {hasData && (
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-600">
            <span className="font-mono font-semibold text-emerald-400">{(runes.winRate * 100).toFixed(1)}%</span>
            <span>{runes.sampleSize.toLocaleString()} games</span>
          </div>
        )}
      </div>

      {!hasData ? (
        <EmptyState message="Rune data is being collected from ranked matches." showTrigger={false} />
      ) : (
        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Primary */}
            {runes.primaryPath?.name && (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  {runes.primaryPath.iconUrl && (
                    <img src={runes.primaryPath.iconUrl} alt={runes.primaryPath.name} className="w-7 h-7" />
                  )}
                  <span className="text-sm font-semibold text-gold-400">{runes.primaryPath.name}</span>
                  <span className="text-xs text-gray-600">Primary</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(runes.primaryRunes ?? []).map(r => <RuneIcon key={r.id} rune={r} />)}
                </div>
              </div>
            )}

            {/* Divider */}
            {runes.primaryPath?.name && runes.secondaryPath?.name && (
              <div className="hidden sm:block w-px self-stretch" style={{ background: 'rgba(255,255,255,0.04)' }} />
            )}

            {/* Secondary */}
            {runes.secondaryPath?.name && (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  {runes.secondaryPath.iconUrl && (
                    <img src={runes.secondaryPath.iconUrl} alt={runes.secondaryPath.name} className="w-7 h-7" />
                  )}
                  <span className="text-sm font-semibold text-gray-300">{runes.secondaryPath.name}</span>
                  <span className="text-xs text-gray-600">Secondary</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(runes.secondaryRunes ?? []).map(r => <RuneIcon key={r.id} rune={r} size="md" />)}
                </div>
              </div>
            )}
          </div>

          {/* Shards */}
          {runes.shards?.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-xs text-gray-600 uppercase tracking-wider mb-2.5">Stat Shards</div>
              <div className="flex gap-2">
                {runes.shards.map((s, i) => <RuneIcon key={i} rune={s} size="sm" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
