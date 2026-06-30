import { HelpCircle } from 'lucide-react'
import type { RuneBuild, Rune } from '../../types'
import EmptyState from './EmptyState'
import WinRateBadge from '../common/WinRateBadge'

interface Props {
  runes: RuneBuild
}

function RuneIcon({ rune, size = 'md', active = true }: { rune: Rune; size?: 'sm' | 'md'; active?: boolean }) {
  const sizeCls = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10'

  if (!rune.imageUrl) {
    return (
      <div className={`${sizeCls} rounded-full bg-rift-border flex items-center justify-center`}>
        <HelpCircle className="w-4 h-4 text-gray-600" />
      </div>
    )
  }

  return (
    <div className="group relative">
      <img
        src={rune.imageUrl}
        alt={rune.name}
        className={`${sizeCls} rounded-full border-2 transition-all ${
          active ? 'border-gold-500/60 opacity-100' : 'border-rift-border opacity-40'
        }`}
        loading="lazy"
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 min-w-max">
        <div className="panel px-2 py-1.5 text-xs">
          <div className="font-semibold text-gold-400">{rune.name}</div>
          {rune.shortDesc && (
            <div
              className="text-gray-400 max-w-xs"
              dangerouslySetInnerHTML={{ __html: rune.shortDesc }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function PathSection({
  path,
  chosen,
  label,
}: {
  path: { name: string; iconUrl: string; id: number }
  chosen: Rune[]
  label: 'primary' | 'secondary'
}) {
  const chosenIds = new Set(chosen.map((r) => r.id))

  return (
    <div className="flex-1">
      {/* Path header */}
      <div className="flex items-center gap-2 mb-4">
        {path.iconUrl && (
          <img
            src={path.iconUrl}
            alt={path.name}
            className="w-8 h-8"
          />
        )}
        <span className={`font-semibold text-sm ${label === 'primary' ? 'text-gold-400' : 'text-gray-300'}`}>
          {path.name}
        </span>
        <span className="text-xs text-gray-500 capitalize">{label}</span>
      </div>

      {/* Chosen runes */}
      <div className="flex flex-wrap gap-2">
        {chosen.map((rune) => (
          <RuneIcon key={rune.id} rune={rune} active={chosenIds.has(rune.id)} />
        ))}
      </div>
    </div>
  )
}

export default function RunePage({ runes }: Props) {
  const hasData = runes.sampleSize > 0

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Rune Page</span>
        {hasData && (
          <div className="ml-auto flex items-center gap-3 text-xs">
            <WinRateBadge value={runes.winRate} size="sm" label="WR" />
            <span className="text-gray-500">{runes.sampleSize.toLocaleString()} games</span>
          </div>
        )}
      </div>

      {!hasData ? (
        <EmptyState message="Rune data is being collected from ranked matches." />
      ) : (
        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-8">
            {runes.primaryPath?.name && (
              <PathSection
                path={runes.primaryPath}
                chosen={runes.primaryRunes ?? []}
                label="primary"
              />
            )}
            {runes.secondaryPath?.name && (
              <PathSection
                path={runes.secondaryPath}
                chosen={runes.secondaryRunes ?? []}
                label="secondary"
              />
            )}
          </div>

          {runes.shards && runes.shards.length > 0 && (
            <div className="mt-5 pt-5 border-t border-rift-border">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Stat Shards</div>
              <div className="flex gap-2">
                {runes.shards.map((shard, i) => (
                  <RuneIcon key={i} rune={shard} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
