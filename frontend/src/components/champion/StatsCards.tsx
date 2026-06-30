import clsx from 'clsx'
import { TrendingUp, Users, ShieldOff, FlaskConical } from 'lucide-react'
import type { ChampionStats } from '../../types'

interface Props {
  stats: ChampionStats
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
  sub?: string
}) {
  return (
    <div className="panel p-4 flex items-center gap-4">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-xl font-bold text-gray-100">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function StatsCards({ stats }: Props) {
  const hasData = stats.sampleSize > 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={TrendingUp}
        label="Win Rate"
        value={hasData ? `${(stats.winRate * 100).toFixed(1)}%` : '—'}
        color={
          !hasData ? 'bg-gray-800 text-gray-500' :
          stats.winRate >= 0.53 ? 'bg-emerald-900/40 text-emerald-400' :
          stats.winRate >= 0.47 ? 'bg-gray-800 text-gray-400' :
          'bg-red-900/40 text-red-400'
        }
        sub={hasData ? `${stats.wins}W ${stats.losses}L` : 'No data'}
      />
      <StatCard
        icon={Users}
        label="Pick Rate"
        value={hasData ? `${(stats.pickRate * 100).toFixed(1)}%` : '—'}
        color="bg-blue-900/40 text-blue-400"
        sub={hasData ? `${stats.games.toLocaleString()} games` : undefined}
      />
      <StatCard
        icon={ShieldOff}
        label="Ban Rate"
        value={hasData ? `${(stats.banRate * 100).toFixed(1)}%` : '—'}
        color="bg-red-900/30 text-red-400"
      />
      <StatCard
        icon={FlaskConical}
        label="Sample Size"
        value={hasData ? stats.sampleSize.toLocaleString() : '—'}
        color="bg-purple-900/30 text-purple-400"
        sub={hasData ? `Patch ${stats.patch}` : 'Collecting data...'}
      />
    </div>
  )
}
