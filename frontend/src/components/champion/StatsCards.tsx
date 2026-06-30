import type { ChampionStats } from '../../types'

interface Props { stats: ChampionStats }

function winColor(wr: number) {
  if (wr >= 0.53) return { text: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)' }
  if (wr >= 0.50) return { text: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)' }
  if (wr >= 0.47) return { text: '#9ca3af', bg: 'rgba(156,163,175,0.05)', border: 'rgba(156,163,175,0.1)' }
  return               { text: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.15)' }
}

interface CardProps { label: string; value: string; sub?: string; accent: { text: string; bg: string; border: string } }

function StatCard({ label, value, sub, accent }: CardProps) {
  return (
    <div className="relative rounded-2xl p-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
         style={{ background: 'rgba(17,24,39,0.6)', border: `1px solid ${accent.border}`, boxShadow: `0 4px 20px rgba(0,0,0,0.3)` }}>
      {/* Subtle background tint */}
      <div className="absolute inset-0 rounded-2xl" style={{ background: accent.bg, opacity: 0.5 }} />
      <div className="relative z-10">
        <div className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-2">{label}</div>
        <div className="text-2xl font-black font-mono tracking-tight" style={{ color: accent.text }}>{value}</div>
        {sub && <div className="text-xs text-gray-600 mt-1.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function StatsCards({ stats }: Props) {
  const hasData  = stats.sampleSize > 0
  const wrColors = hasData ? winColor(stats.winRate) : { text: '#374151', bg: 'transparent', border: 'rgba(255,255,255,0.05)' }
  const blue     = { text: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.12)' }
  const red      = { text: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.1)' }
  const purple   = { text: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.1)' }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Win Rate"
        value={hasData ? `${(stats.winRate * 100).toFixed(1)}%` : '—'}
        sub={hasData ? `${stats.wins.toLocaleString()}W · ${stats.losses.toLocaleString()}L` : 'Collecting data'}
        accent={wrColors}
      />
      <StatCard
        label="Pick Rate"
        value={hasData ? `${(stats.pickRate * 100).toFixed(1)}%` : '—'}
        sub={hasData ? `${stats.games.toLocaleString()} games` : undefined}
        accent={blue}
      />
      <StatCard
        label="Ban Rate"
        value={hasData ? `${(stats.banRate * 100).toFixed(1)}%` : '—'}
        accent={red}
      />
      <StatCard
        label="Sample"
        value={hasData ? stats.sampleSize.toLocaleString() : '—'}
        sub={hasData ? `Patch ${stats.patch}` : 'Worker needs to run'}
        accent={purple}
      />
    </div>
  )
}
