import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Swords } from 'lucide-react'
import { fetchChampions } from '../../api/client'
import type { Champion } from '../../types'

export default function Navbar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const { data: champions = [] } = useQuery({
    queryKey: ['champions'],
    queryFn: fetchChampions,
    staleTime: 30 * 60 * 1000,
  })

  const filtered =
    query.length >= 2
      ? champions
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
      : []

  function handleSelect(champ: Champion) {
    setQuery('')
    setFocused(false)
    navigate(`/champion/${champ.id}`)
  }

  return (
    <nav className="sticky top-0 z-50 bg-rift-dark/90 backdrop-blur-sm border-b border-rift-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Swords className="w-5 h-5 text-gold-400" />
          <span className="font-display text-gold-400 font-bold text-lg tracking-wide">
            RiftMeta
          </span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search champion..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-rift-panel border border-rift-border rounded
                         text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-500/50
                         transition-colors"
            />
          </div>

          {focused && filtered.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 panel py-1 max-h-72 overflow-y-auto scrollbar-thin z-50">
              {filtered.map((champ) => (
                <li key={champ.id}>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-rift-border/50 transition-colors text-left"
                    onMouseDown={() => handleSelect(champ)}
                  >
                    <img
                      src={champ.imageUrl}
                      alt={champ.name}
                      className="w-7 h-7 rounded border border-rift-border"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-100">{champ.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{champ.tags?.join(' · ')}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 ml-auto">
          <Link to="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-gold-400 transition-colors rounded">
            Tier List
          </Link>
          <Link to="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-gold-400 transition-colors rounded">
            Champions
          </Link>
        </div>
      </div>
    </nav>
  )
}
