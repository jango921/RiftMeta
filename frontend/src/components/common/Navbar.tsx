import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Swords, X } from 'lucide-react'
import { fetchChampions } from '../../api/client'
import type { Champion } from '../../types'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { data: champions = [] } = useQuery({
    queryKey: ['champions'],
    queryFn: fetchChampions,
    staleTime: 30 * 60 * 1000,
  })

  const filtered = query.length >= 2
    ? champions.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 7)
    : []

  function handleSelect(champ: Champion) {
    setQuery('')
    setFocused(false)
    navigate(`/champion/${champ.id}`)
  }

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(8,12,20,0.85)'
          : 'rgba(8,12,20,0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-5">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-gold"
               style={{ background: 'linear-gradient(135deg, rgba(200,155,60,0.2), rgba(200,155,60,0.05))', border: '1px solid rgba(200,155,60,0.3)' }}>
            <Swords className="w-3.5 h-3.5 text-gold-500" />
          </div>
          <span className="font-display font-bold text-base gradient-gold tracking-wide">RiftMeta</span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Search champion…"
              className="w-full pl-8 pr-8 py-1.5 text-sm rounded-xl text-gray-100 placeholder-gray-600
                         focus:outline-none transition-all duration-200"
              style={{
                background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                border: focused ? '1px solid rgba(200,155,60,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 text-gray-600 hover:text-gray-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {focused && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden animate-slide-down z-50"
                 style={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
              {filtered.map(champ => (
                <button
                  key={champ.id}
                  onMouseDown={() => handleSelect(champ)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <img src={champ.imageUrl} alt={champ.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-100 truncate">{champ.name}</div>
                    <div className="text-xs text-gray-600 truncate">{champ.tags?.join(' · ')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 ml-auto">
          {[{ to: '/', label: 'Home' }, { to: '/', label: 'Champions' }].map(({ to, label }) => (
            <Link
              key={label}
              to={to}
              className="px-3.5 py-1.5 text-sm rounded-lg transition-all duration-150"
              style={{
                color: location.pathname === to ? '#C89B3C' : 'rgba(156,163,175,1)',
                background: location.pathname === to ? 'rgba(200,155,60,0.08)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
