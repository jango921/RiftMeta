import { Ban, Crosshair, Database, Trophy } from 'lucide-react'
import type { ChampionStats } from '../../types'

interface Props { stats: ChampionStats }

function winColor(wr: number) {
  if (wr >= 0.53) return '#34d399'
  if (wr >= 0.50) return '#f0c84d'
  if (wr >= 0.47) return '#cbd5e1'
  return '#f87171'
}

interface CardProps {
  label: string
  value: string
  sub?: string
  color: string
  icon: typeof Trophy
}

function StatCard({ label, value, sub, color, icon: Icon }: CardProps) {
  return (
    <div className="rift-panel p-4 transition duration-150 hover:-translate-y-0.5 hover:border-gold-300/25">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-black uppercase text-slate-600">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
          <Icon className="h-4 w-4" style={{ color }} />
        </span>
      </div>
      <div className="font-mono text-3xl font-black tracking-tight" style={{ color }}>{value}</div>
      {sub && <div className="mt-1.5 text-xs font-semibold text-slate-600">{sub}</div>}
    </div>
  )
}

export default function StatsCards({ stats }: Props) {
  const hasData = stats.sampleSize > 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Win Rate"
        value={hasData ? `${(stats.winRate * 100).toFixed(1)}%` : '-'}
        sub={hasData ? `${stats.wins.toLocaleString()}W / ${stats.losses.toLocaleString()}L` : 'Collecting data'}
        color={hasData ? winColor(stats.winRate) : '#475569'}
        icon={Trophy}
      />
      <StatCard
        label="Pick Rate"
        value={hasData ? `${(stats.pickRate * 100).toFixed(1)}%` : '-'}
        sub={hasData ? `${stats.games.toLocaleString()} games` : undefined}
        color="#60a5fa"
        icon={Crosshair}
      />
      <StatCard
        label="Ban Rate"
        value={hasData ? `${(stats.banRate * 100).toFixed(1)}%` : '-'}
        color="#f87171"
        icon={Ban}
      />
      <StatCard
        label="Sample"
        value={hasData ? stats.sampleSize.toLocaleString() : '-'}
        sub={hasData ? `Patch ${stats.patch}` : 'Worker needs to run'}
        color="#0ac8b9"
        icon={Database}
      />
    </div>
  )
}
