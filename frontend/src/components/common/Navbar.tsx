import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Search, Swords, X } from 'lucide-react'
import clsx from 'clsx'
import { fetchChampions } from '../../api/client'
import type { Champion } from '../../types'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
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
      className="fixed inset-x-0 top-0 z-50 transition duration-200"
      style={{
        background: scrolled ? 'rgba(5,8,16,0.88)' : 'rgba(5,8,16,0.64)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        borderBottom: scrolled ? '1px solid rgba(200,155,60,0.16)' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="rift-shell flex h-16 items-center gap-4">
        <Link to="/" className="group flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gold-400/35 bg-gold-400/10 transition group-hover:border-gold-300/70">
            <Swords className="h-4 w-4 text-gold-300" />
          </span>
          <span className="font-display text-lg font-black tracking-normal text-white">
            Rift<span className="text-gold-300">Meta</span>
          </span>
        </Link>

        <div className="relative hidden flex-1 sm:block sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search champion"
            className="h-10 w-full rounded-md border border-white/10 bg-white/[0.045] pl-9 pr-9 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-gold-400/45"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {focused && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-gold-400/20 bg-[#080d17]/95 shadow-2xl backdrop-blur-xl">
              {filtered.map((champ, i) => (
                <button
                  key={champ.id}
                  onMouseDown={() => handleSelect(champ)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.045]"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.055)' : 'none' }}
                >
                  <img src={champ.imageUrl} alt={champ.name} className="h-8 w-8 shrink-0 rounded-md border border-white/10 object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-100">{champ.name}</div>
                    <div className="truncate text-xs text-slate-600">{champ.tags?.join(' / ')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {[
            { to: '/', label: 'Meta', icon: BarChart3 },
            { to: '/', label: 'Champions', icon: Swords },
          ].map(({ to, label, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className={clsx(
                'hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition sm:inline-flex',
                location.pathname === to ? 'bg-gold-400/10 text-gold-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
