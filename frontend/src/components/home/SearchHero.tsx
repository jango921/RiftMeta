import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { Champion } from '../../types'

interface Props {
  champions: Champion[]
  version: string
}

export default function SearchHero({ champions, version }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const filtered =
    query.length >= 2
      ? champions
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
      : []

  function handleSelect(champ: Champion) {
    setQuery('')
    navigate(`/champion/${champ.id}`)
  }

  return (
    <div className="relative text-center py-20 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-shadow-gold mb-2">
          <span className="gold-gradient">RiftMeta</span>
        </h1>
        <p className="text-gray-400 text-sm mb-2">
          Champion stats, builds & tier lists powered by ranked match data
        </p>
        {version && (
          <span className="inline-block text-xs text-gray-600 bg-rift-panel border border-rift-border rounded-full px-3 py-0.5 mb-8">
            Patch {version}
          </span>
        )}

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search any champion..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="w-full pl-12 pr-4 py-3.5 text-base bg-rift-panel border border-rift-border rounded-lg
                       text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-500/60
                       shadow-panel transition-colors"
          />

          {focused && filtered.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 panel py-1 max-h-80 overflow-y-auto scrollbar-thin z-50 text-left">
              {filtered.map((champ) => (
                <li key={champ.id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rift-border/50 transition-colors"
                    onMouseDown={() => handleSelect(champ)}
                  >
                    <img
                      src={champ.imageUrl}
                      alt={champ.name}
                      className="w-8 h-8 rounded border border-rift-border"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-100">{champ.name}</div>
                      <div className="text-xs text-gray-500">{champ.title}</div>
                    </div>
                    <div className="ml-auto text-xs text-gray-600">
                      {champ.tags?.join(' · ')}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
