import { Swords } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-rift-border bg-rift-dark mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-gold-400" />
              <span className="font-display text-gold-400 font-bold">RiftMeta</span>
            </Link>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Fast, community-driven champion analytics powered by Riot's official API and Data Dragon.
            </p>
          </div>

          <div className="text-xs text-gray-600 max-w-md leading-relaxed">
            <p className="mb-2 text-gray-500 font-medium">Legal Disclaimer</p>
            <p>
              RiftMeta isn't endorsed by Riot Games and doesn't reflect the views or opinions of
              Riot Games or anyone officially involved in producing or managing Riot Games
              properties. Riot Games and all associated properties are trademarks or registered
              trademarks of Riot Games, Inc.
            </p>
            <p className="mt-2">
              Champion data and images provided by{' '}
              <a
                href="https://developer.riotgames.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-500 hover:text-gold-400 underline"
              >
                Riot Games Data Dragon
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-rift-border/50 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} RiftMeta. Not affiliated with Riot Games.
        </div>
      </div>
    </footer>
  )
}
