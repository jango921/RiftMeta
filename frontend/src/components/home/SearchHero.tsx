import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Zap } from 'lucide-react'
import type { Champion } from '../../types'

interface Props {
  champions: Champion[]
  version: string
}

export default function SearchHero({ champions, version }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const filtered = query.length >= 2
    ? champions.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 7)
    : []

  return (
    <div className="relative pt-32 pb-16 px-4 text-center overflow-hidden">

      {/* Background aurora layers */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
             style={{ background: 'radial-gradient(ellipse at center, rgba(123,43,226,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-10 left-1/4 w-[400px] h-[300px]"
             style={{ background: 'radial-gradient(ellipse at center, rgba(10,200,185,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-20 right-1/4 w-[300px] h-[200px]"
             style={{ background: 'radial-gradient(ellipse at center, rgba(200,155,60,0.06) 0%, transparent 70%)' }} />
        {/* Floating orbs */}
        <div className="absolute top-16 left-[15%] w-2 h-2 rounded-full bg-gold-500/30 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-24 right-[20%] w-1.5 h-1.5 rounded-full bg-teal-400/30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-32 left-[30%] w-1 h-1 rounded-full bg-purple-500/40 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Patch badge */}
        {version && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-6 text-xs font-medium"
               style={{ background: 'rgba(10,200,185,0.08)', border: '1px solid rgba(10,200,185,0.2)', color: '#0AC8B9' }}>
            <Zap className="w-3 h-3" />
            Patch {version} · Live Data
          </div>
        )}

        {/* Headline */}
        <h1 className="font-display font-black mb-3 leading-none tracking-tight">
          <span className="block text-5xl sm:text-6xl lg:text-7xl gradient-gold text-glow-gold">RiftMeta</span>
          <span className="block text-lg sm:text-xl text-gray-500 font-body font-normal mt-3 tracking-normal">
            Champion analytics powered by high-elo ranked data
          </span>
        </h1>

        {/* Search bar */}
        <div className="relative mt-10 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Search any champion…"
              className="w-full pl-12 pr-4 py-4 text-base rounded-2xl text-gray-100 placeholder-gray-600
                         focus:outline-none transition-all duration-300"
              style={{
                background: 'rgba(13,17,23,0.8)',
                border: focused ? '1px solid rgba(200,155,60,0.4)' : '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                boxShadow: focused
                  ? '0 0 0 3px rgba(200,155,60,0.08), 0 16px 48px rgba(0,0,0,0.5)'
                  : '0 8px 32px rgba(0,0,0,0.4)',
              }}
            />
          </div>

          {focused && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 animate-slide-down"
                 style={{ background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
              {filtered.map((champ, i) => (
                <button
                  key={champ.id}
                  onMouseDown={() => { navigate(`/champion/${champ.id}`); setQuery('') }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left group"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <img src={champ.imageUrl} alt={champ.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-100 group-hover:text-gold-400 transition-colors">{champ.name}</div>
                    <div className="text-sm text-gray-600">{champ.title}</div>
                  </div>
                  <div className="text-xs text-gray-600 shrink-0">{champ.tags?.join(' · ')}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats row */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-600">
          <span>{champions.length} champions</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Challenger · Diamond+ data</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Updates every 4 hours</span>
        </div>
      </div>
    </div>
  )
}
