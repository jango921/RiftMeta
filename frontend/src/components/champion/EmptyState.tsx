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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Database className="w-10 h-10 text-gray-700 mb-3" />
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      <p className="text-xs text-gray-600 mt-1 mb-4">
        The background worker processes ranked matches to generate stats.
      </p>

      {showTrigger && state === 'idle' && (
        <button
          onClick={handleTrigger}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded border border-gold-500/40
                     text-gold-400 hover:bg-gold-500/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Trigger data collection now
        </button>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Starting worker…
        </div>
      )}

      {state === 'started' && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          Worker started — check back in a few minutes.
        </div>
      )}

      {state === 'running' && (
        <div className="flex items-center gap-2 text-xs text-yellow-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Worker is already running — data will appear soon.
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
