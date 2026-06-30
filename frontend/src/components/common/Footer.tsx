import { Database, Swords } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative border-t border-gold-400/15 bg-[#050810]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/45 to-transparent" />

      <div className="rift-shell py-10">
        <div className="grid gap-8 md:grid-cols-[1fr_1.25fr] md:items-start">
          <div>
            <Link to="/" className="group mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gold-400/35 bg-gold-400/10">
                <Swords className="h-4 w-4 text-gold-300" />
              </span>
              <span className="font-display text-lg font-black text-white">Rift<span className="text-gold-300">Meta</span></span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Fast champion analytics powered by Riot's official API and Data Dragon.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <Database className="h-3.5 w-3.5" />
                Riot Dev Portal
              </a>
              <Link to="/" className="btn-ghost">Champions</Link>
            </div>
          </div>

          <div className="rift-panel p-4">
            <p className="mb-2 text-xs font-black uppercase text-slate-400">Legal Disclaimer</p>
            <p className="text-xs leading-6 text-slate-600">
              RiftMeta isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially
              involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or
              registered trademarks of Riot Games, Inc.
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              Champion data and images are provided by{' '}
              <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline underline-offset-2">
                Riot Games Data Dragon
              </a>.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/[0.06] pt-5 text-center text-xs text-slate-700">
          (c) {new Date().getFullYear()} RiftMeta - Not affiliated with Riot Games
        </div>
      </div>
    </footer>
  )
}
