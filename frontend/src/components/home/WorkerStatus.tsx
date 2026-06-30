import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import axios from 'axios'

interface WorkerStatusData {
  running: boolean
  lastRunAt: string
  lastRunPatch: string
  matchesTotal: number
  matchesThisRun: number
  error?: string
}

async function fetchWorkerStatus(): Promise<WorkerStatusData> {
  const { data } = await axios.get('/api/admin/worker/status')
  return data
}

export default function WorkerStatus() {
  const [triggering, setTriggering] = useState(false)

  const { data: status, refetch } = useQuery({
    queryKey: ['worker', 'status'],
    queryFn: fetchWorkerStatus,
    refetchInterval: (query) => (query.state.data?.running ? 5000 : 60_000),
  })

  async function trigger() {
    setTriggering(true)
    try {
      await axios.post('/api/admin/worker/run')
      setTimeout(() => refetch(), 1000)
    } catch {
      refetch()
    } finally {
      setTriggering(false)
    }
  }

  if (!status) return null

  const hasData = status.matchesTotal > 0
  const Icon = status.running ? Activity : hasData ? CheckCircle2 : AlertCircle

  return (
    <div className="rift-panel flex flex-col gap-3 px-4 py-3 text-xs sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
          {status.running && <span className="absolute inset-1 rounded-md bg-teal-400/10 animate-pulse" />}
          <Icon className={`relative h-4 w-4 ${status.running ? 'text-teal-300' : hasData ? 'text-emerald-300' : 'text-slate-500'}`} />
        </span>

        <div className="min-w-0">
          <div className="font-bold text-slate-200">
            {status.running
              ? 'Collecting ranked matches'
              : hasData
              ? 'Data worker ready'
              : 'No match data yet'}
          </div>
          <div className="truncate text-slate-500">
            {status.running
              ? `${status.matchesThisRun.toLocaleString()} matches processed this run`
              : hasData
              ? `${status.matchesTotal.toLocaleString()} matches - patch ${status.lastRunPatch || '-'}`
              : 'Start the worker to unlock live rankings, builds, runes, and counters'}
            {status.error ? ` - ${status.error}` : ''}
          </div>
        </div>
      </div>

      {!status.running && (
        <button
          onClick={trigger}
          disabled={triggering}
          className="btn-ghost sm:ml-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${triggering ? 'animate-spin' : ''}`} />
          {hasData ? 'Refresh Data' : 'Start Worker'}
        </button>
      )}
    </div>
  )
}
