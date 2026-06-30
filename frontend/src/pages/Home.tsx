import { useQuery } from '@tanstack/react-query'
import { fetchChampions, fetchMetaTop, fetchVersion } from '../api/client'
import SearchHero from '../components/home/SearchHero'
import TopChampions from '../components/home/TopChampions'
import WorkerStatus from '../components/home/WorkerStatus'
import ChampionCard from '../components/common/ChampionCard'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Home() {
  const { data: version = '' } = useQuery({
    queryKey: ['version'],
    queryFn: fetchVersion,
  })

  const { data: champions = [], isLoading: champsLoading } = useQuery({
    queryKey: ['champions'],
    queryFn: fetchChampions,
    staleTime: 30 * 60 * 1000,
  })

  const { data: meta } = useQuery({
    queryKey: ['meta', 'top'],
    queryFn: () => fetchMetaTop(),
    staleTime: 15 * 60 * 1000,
  })

  // Popular champions (first 24 alphabetically)
  const popularChamps = [...champions]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 24)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero search */}
      <SearchHero champions={champions} version={version} />

      {/* Worker status bar */}
      <WorkerStatus />

      {/* Meta tier lists */}
      {meta && (
        <section className="mb-12">
          <h2 className="font-display text-gold-400 text-lg font-semibold mb-4 uppercase tracking-wider">
            Current Meta — Patch {meta.patch}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TopChampions title="Top Win Rate" items={meta.topWinRate} />
            <TopChampions title="Top Pick Rate" items={meta.topPickRate} />
            <TopChampions title="Top Ban Rate"  items={meta.topBanRate} />
          </div>
        </section>
      )}

      {/* Champion grid */}
      <section className="mb-16">
        <h2 className="font-display text-gold-400 text-lg font-semibold mb-4 uppercase tracking-wider">
          All Champions
        </h2>

        {champsLoading ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {popularChamps.map((champ) => (
              <ChampionCard key={champ.id} champion={champ} showStats={false} size="sm" />
            ))}
          </div>
        )}

        {!champsLoading && champions.length > 24 && (
          <div className="mt-4 text-center">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-2">
              {[...champions]
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(24)
                .map((champ) => (
                  <ChampionCard key={champ.id} champion={champ} showStats={false} size="sm" />
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
