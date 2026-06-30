import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Zap } from 'lucide-react'
import type { Champion } from '../../types'

interface Props {
  champions: Champion[]
  version: string
  featured?: Champion[]
}

export default function SearchHero({ champions, version, featured = [] }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const filtered = query.length >= 2
    ? champions.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  const splashStack = useMemo(() => {
    const seed = featured.length ? featured : champions.slice(0, 4)
    return seed.slice(0, 4)
  }, [champions, featured])

  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
        <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(115deg,rgba(5,8,16,0.96)_0%,rgba(5,8,16,0.82)_44%,rgba(5,8,16,0.28)_100%)]" />
      </div>

      <div className="rift-shell relative grid min-h-[520px] items-center gap-8 pb-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative z-10 max-w-2xl">
          {version && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-teal-400/30 bg-teal-400/10 px-3 py-1.5 text-xs font-bold uppercase text-teal-200">
              <Zap className="h-3.5 w-3.5" />
              Patch {version} Live Data
            </div>
          )}

          <h1 className="font-display text-5xl font-black leading-none tracking-normal text-white sm:text-6xl lg:text-7xl">
            Rift<span className="gradient-gold">Meta</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Fast champion rankings, builds, runes, counters, and matchup context for climbing the Rift.
          </p>

          <div className="relative mt-8 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder="Search a champion"
                className="h-14 w-full rounded-lg border bg-[#070b13]/90 pl-12 pr-4 text-base font-semibold text-white outline-none transition placeholder:text-slate-600"
                style={{
                  borderColor: focused ? 'rgba(200,155,60,0.48)' : 'rgba(255,255,255,0.12)',
                  boxShadow: focused ? '0 0 0 3px rgba(200,155,60,0.10), 0 22px 60px rgba(0,0,0,0.48)' : '0 16px 42px rgba(0,0,0,0.38)',
                }}
              />
            </div>

            {focused && filtered.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-gold-400/20 bg-[#080d17]/95 shadow-2xl backdrop-blur-xl">
                {filtered.map((champ, i) => (
                  <button
                    key={champ.id}
                    onMouseDown={() => { navigate(`/champion/${champ.id}`); setQuery('') }}
                    className="group flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-white/[0.045]"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.055)' : 'none' }}
                  >
                    <img src={champ.imageUrl} alt={champ.name} className="h-10 w-10 rounded-md border border-white/10 object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-slate-100 group-hover:text-gold-300">{champ.name}</div>
                      <div className="truncate text-xs text-slate-500 capitalize">{champ.title}</div>
                    </div>
                    <div className="hidden text-xs font-bold uppercase text-slate-600 sm:block">{champ.tags?.join(' / ')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold uppercase text-slate-500">
            <span className="stat-chip">{champions.length || '-'} Champions</span>
            <span className="stat-chip">Ranked Solo</span>
            <span className="stat-chip">Role Filters</span>
            <span className="stat-chip">Build Paths</span>
          </div>
        </div>

        <div className="relative hidden h-[430px] lg:block">
          {splashStack.map((champ, index) => (
            <button
              key={champ.id}
              onClick={() => navigate(`/champion/${champ.id}`)}
              className="group absolute overflow-hidden rounded-lg border border-gold-400/20 bg-slate-950 shadow-2xl transition duration-300 hover:z-20 hover:-translate-y-2 hover:border-gold-300/60"
              style={{
                width: index === 0 ? '58%' : '42%',
                height: index === 0 ? '78%' : '46%',
                left: index === 0 ? '18%' : index === 1 ? '0%' : index === 2 ? '55%' : '43%',
                top: index === 0 ? '4%' : index === 1 ? '34%' : index === 2 ? '0%' : '54%',
              }}
            >
              <img src={champ.splashUrl} alt={champ.name} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <div className="font-display text-lg font-black text-white">{champ.name}</div>
                <div className="text-xs uppercase text-gold-300/80">{champ.tags?.join(' / ')}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
