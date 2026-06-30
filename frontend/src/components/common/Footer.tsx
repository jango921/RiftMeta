import { Swords } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-20 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Subtle gradient glow */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(200,155,60,0.3), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-gold"
                   style={{ background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.2)' }}>
                <Swords className="w-3.5 h-3.5 text-gold-400" />
              </div>
              <span className="font-display text-sm font-bold gradient-gold">RiftMeta</span>
            </Link>
            <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
              Fast, community-driven champion analytics powered by Riot's official API and Data Dragon.
            </p>
            <div className="mt-3 flex items-center gap-4">
              <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer"
                 className="text-xs text-gray-700 hover:text-gold-400 transition-colors">Riot Dev Portal</a>
              <Link to="/" className="text-xs text-gray-700 hover:text-gold-400 transition-colors">Champions</Link>
            </div>
          </div>

          {/* Legal */}
          <div className="rounded-2xl px-5 py-4 max-w-md" style={{ background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Legal Disclaimer</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              RiftMeta isn't endorsed by Riot Games and doesn't reflect the views or opinions of
              Riot Games or anyone officially involved in producing or managing Riot Games
              properties. Riot Games and all associated properties are trademarks or registered
              trademarks of Riot Games, Inc.
            </p>
            <p className="text-xs text-gray-600 leading-relaxed mt-2">
              Champion data and images provided by{' '}
              <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer"
                 className="text-gold-500 hover:text-gold-400 underline underline-offset-2 transition-colors">
                Riot Games Data Dragon
              </a>.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 text-center text-xs text-gray-700" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          © {new Date().getFullYear()} RiftMeta &nbsp;·&nbsp; Not affiliated with Riot Games
        </div>
      </div>
    </footer>
  )
}
