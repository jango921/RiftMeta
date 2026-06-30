import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, CheckCircle2, AlertCircle, Activity } from 'lucide-react'
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

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-8 text-xs"
         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      {status.running ? (
        <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0 animate-pulse" />
      ) : hasData ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-gray-600 shrink-0" />
      )}

      <span className="text-gray-500">
        {status.running
          ? <><span className="text-teal-400 font-medium">Collecting</span> · {status.matchesThisRun > 0 ? `${status.matchesThisRun.toLocaleString()} matches processed` : 'starting…'}</>
          : hasData
          ? <><span className="text-gray-400">{status.matchesTotal.toLocaleString()}</span> matches · patch <span className="text-gray-400">{status.lastRunPatch}</span></>
          : 'No match data yet'}
      </span>

      {status.error && <span className="text-red-400/70">· {status.error}</span>}

      {!status.running && (
        <button
          onClick={trigger}
          disabled={triggering}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-150 disabled:opacity-40"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(156,163,175,1)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        >
          <RefreshCw className={`w-3 h-3 ${triggering ? 'animate-spin' : ''}`} />
          {hasData ? 'Re-run' : 'Start'}
        </button>
      )}
    </div>
  )
}
