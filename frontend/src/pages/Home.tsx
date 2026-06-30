import { useQuery } from '@tanstack/react-query'
import { fetchChampions, fetchMetaTop, fetchVersion } from '../api/client'
import SearchHero from '../components/home/SearchHero'
import TopChampions from '../components/home/TopChampions'
import WorkerStatus from '../components/home/WorkerStatus'
import ChampionCard from '../components/common/ChampionCard'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Home() {
  const { data: version = '' } = useQuery({ queryKey: ['version'], queryFn: fetchVersion })

  const { data: champions = [], isLoading } = useQuery({
    queryKey: ['champions'],
    queryFn: fetchChampions,
    staleTime: 30 * 60 * 1000,
  })

  const { data: meta } = useQuery({
    queryKey: ['meta', 'top'],
    queryFn: () => fetchMetaTop(),
    staleTime: 15 * 60 * 1000,
  })

  const sorted = [...champions].sort((a, b) => a.name.localeCompare(b.name))
  const featured = sorted.slice(0, 3)

  return (
    <div style={{ background: '#080C14', minHeight: '100vh' }}>
      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(123,43,226,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(10,200,185,0.07) 0%, transparent 60%)'
      }} />

      <div className="relative z-10">
        <SearchHero champions={champions} version={version} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-16">

          {/* Worker status */}
          <WorkerStatus />

          {/* ---- Meta Tier List ---- */}
          {meta && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                  Current Meta
                  <span className="ml-3 text-gold-500">{meta.patch}</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ height: '380px' }}>
                <TopChampions title="Win Rate"  accent="#34d399" items={meta.topWinRate}  valueKey="winRate"  />
                <TopChampions title="Pick Rate" accent="#60a5fa" items={meta.topPickRate} valueKey="pickRate" />
                <TopChampions title="Ban Rate"  accent="#f87171" items={meta.topBanRate}  valueKey="banRate"  />
              </div>
            </section>
          )}

          {/* ---- Featured champions bento ---- */}
          {featured.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-gray-500 mb-5">
                Featured Champions
              </h2>
              <div className="grid grid-cols-3 gap-3" style={{ height: '280px' }}>
                {featured.map(champ => (
                  <ChampionCard key={champ.id} champion={champ} featured showStats={false} />
                ))}
              </div>
            </section>
          )}

          {/* ---- All champions grid ---- */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                All Champions
                <span className="ml-3 text-gray-700">{champions.length}</span>
              </h2>
            </div>

            {isLoading ? (
              <LoadingSpinner size="lg" className="py-20" />
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                {sorted.map(champ => (
                  <ChampionCard key={champ.id} champion={champ} showStats={false} size="sm" />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
