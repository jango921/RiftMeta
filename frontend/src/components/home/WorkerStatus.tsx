import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
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
      // 409 = already running, that's fine
      refetch()
    } finally {
      setTriggering(false)
    }
  }

  if (!status) return null

  const hasData = status.matchesTotal > 0
  const lastRun = status.lastRunAt
    ? new Date(status.lastRunAt).toLocaleString()
    : 'Never'

  return (
    <div className="flex items-center gap-3 text-xs px-4 py-2 rounded border border-rift-border bg-rift-panel/50 mb-6">
      {status.running ? (
        <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin shrink-0" />
      ) : hasData ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
      )}

      <span className="text-gray-400">
        {status.running
          ? `Collecting match data… ${status.matchesThisRun > 0 ? `(${status.matchesThisRun} matches so far)` : ''}`
          : hasData
          ? `${status.matchesTotal.toLocaleString()} matches processed · patch ${status.lastRunPatch} · last run ${lastRun}`
          : 'No match data yet — click Start collection'}
      </span>

      {status.error && (
        <span className="text-red-400 ml-1">({status.error})</span>
      )}

      {!status.running && (
        <button
          onClick={trigger}
          disabled={triggering}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded border border-rift-border
                     hover:border-gold-500/50 text-gray-400 hover:text-gold-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${triggering ? 'animate-spin' : ''}`} />
          {hasData ? 'Re-run' : 'Start collection'}
        </button>
      )}
    </div>
  )
}
