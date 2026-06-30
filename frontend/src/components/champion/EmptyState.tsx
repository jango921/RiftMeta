import { useState } from 'react'
import { Database, RefreshCw, CheckCircle } from 'lucide-react'
import axios from 'axios'

interface Props {
  message?: string
  showTrigger?: boolean
}

export default function EmptyState({
  message = 'Data is being collected for this champion.',
  showTrigger = true,
}: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'started' | 'running' | 'error'>('idle')

  async function handleTrigger() {
    setState('loading')
    try {
      await axios.post('/api/admin/worker/run')
      setState('started')
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setState('running') // already running
      } else {
        setState('error')
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
        <Database className="h-5 w-5 text-slate-600" />
      </span>
      <p className="max-w-xs text-sm font-semibold text-slate-400">{message}</p>
      <p className="mb-4 mt-1 text-xs text-slate-600">
        The background worker processes ranked matches to generate stats.
      </p>

      {showTrigger && state === 'idle' && (
        <button
          onClick={handleTrigger}
          className="btn-ghost text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Trigger data collection now
        </button>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Starting worker...
        </div>
      )}

      {state === 'started' && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5" />
          Worker started - check back in a few minutes.
        </div>
      )}

      {state === 'running' && (
        <div className="flex items-center gap-2 text-xs text-yellow-400">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Worker is already running - data will appear soon.
        </div>
      )}

      {state === 'error' && (
        <p className="text-xs text-red-400">
          Could not start worker. Check that RIOT_API_KEY is set in your .env.
        </p>
      )}
    </div>
  )
}
