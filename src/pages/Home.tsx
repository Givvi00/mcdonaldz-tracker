import { useRef } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { McdonaldCard } from '@/components/McdonaldCard';
import { SodaRegion } from '@/components/SodaRegion';

export function Home() {
  const {
    filterRegion,
    setFilterRegion,
    filterVisited,
    setFilterVisited,
    getFilteredMcdonalds,
    mcdonalds,
    getVisitedCount,
    getNearestMcdonalds,
    getNearestUnvisited,
    getTopRegions,
    locationStatus,
    setSelectedTab,
    focusOnMap,
  } = useMcdonaldStore();

  const listRef = useRef<HTMLDivElement>(null);

  const filtered = getFilteredMcdonalds();
  const uniqueRegions = [...new Set(mcdonalds.map(m => m.region))].sort();
  const visitedCount = getVisitedCount();
  const total = mcdonalds.length;
  const percentage = total > 0 ? Math.round((visitedCount / total) * 100) : 0;
  const nearest = getNearestMcdonalds(4);
  const topRegions = getTopRegions(3);

  const jumpToRegion = (region: string) => {
    setFilterRegion(filterRegion === region ? null : region);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const findNearest = () => {
    const nearest = getNearestUnvisited();
    if (nearest) focusOnMap(nearest.id);
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Hero progress */}
      <button
        onClick={() => setSelectedTab('stats')}
        className="relative mx-4 mt-4 text-left bg-gradient-to-br from-mc-red to-red-700 text-white rounded-3xl p-5 shadow-lg shadow-red-900/20 active:scale-[0.99] transition-transform overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="relative">
          <p className="text-xs font-display font-semibold uppercase tracking-wide opacity-80">Il tuo progresso</p>
          <div className="flex items-end gap-3 mt-1">
            <p className="text-4xl font-display font-bold">{visitedCount}</p>
            <p className="text-sm opacity-80 mb-1">/ {total} McDonald's · {percentage}%</p>
          </div>
          <div className="w-full bg-white/25 rounded-full h-2 mt-3">
            <div
              className="bg-mc-yellow h-2 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </button>

      {/* Vicino a te */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-950/50 text-sm">📍</span>
            Vicino a te
          </h2>
          {locationStatus === 'granted' && nearest.length > 0 && (
            <button
              onClick={findNearest}
              className="flex items-center gap-1 text-xs font-semibold text-mc-red bg-mc-red/10 dark:bg-mc-red/20 px-3 py-1.5 rounded-full active:scale-[0.96] transition-transform"
            >
              🎯 Il più vicino
            </button>
          )}
        </div>
        {locationStatus === 'granted' && nearest.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {nearest.map(mc => (
              <McdonaldCard key={mc.id} mc={mc} distanceKm={mc.distanceKm} variant="compact" />
            ))}
          </div>
        )}
        {(locationStatus === 'loading' || locationStatus === 'idle') && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Rilevamento posizione in corso...</p>
        )}
        {(locationStatus === 'denied' || locationStatus === 'unsupported') && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Attiva la geolocalizzazione dal browser per vedere i McDonald's più vicini a te.
          </p>
        )}
      </section>

      {/* Top regioni */}
      {topRegions.length > 0 && (
        <section className="px-4">
          <h2 className="font-display font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-sm">🏆</span>
            Top Regioni
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {topRegions.map(r => (
              <button
                key={r.region}
                onClick={() => jumpToRegion(r.region)}
                className="flex-shrink-0 w-28 flex flex-col items-center text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 shadow-sm hover:border-mc-red dark:hover:border-mc-red active:scale-[0.97] transition-all"
              >
                <div className="flex items-center justify-center" style={{ height: 105 }}>
                  <SodaRegion region={r.region} percentage={r.percentage} />
                </div>
                <div className="mt-1.5">
                  <p className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate w-full">{r.region}</p>
                  <p className="text-[0.65rem] font-bold text-mc-red">{r.visited}/{r.total} · {r.percentage}%</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Esplora tutti */}
      <section ref={listRef} className="px-4 pt-2 border-t border-gray-200 dark:border-gray-800">
        <h2 className="font-display font-semibold text-gray-800 dark:text-gray-100 mb-3 mt-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">🔎</span>
          Esplora tutti
        </h2>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterVisited === null && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-gray-800 dark:bg-gray-700 text-white">
              Tutti
            </span>
          )}
          {filterVisited !== true && (
            <button
              onClick={() => setFilterVisited(true)}
              className="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-800"
            >
              ✓ Visitati
            </button>
          )}
          {filterVisited !== false && (
            <button
              onClick={() => setFilterVisited(false)}
              className="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800"
            >
              ✗ Da visitare
            </button>
          )}
          {filterVisited !== null && (
            <button
              onClick={() => setFilterVisited(null)}
              className="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              ✕ Reset
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {filterRegion && (
            <button
              onClick={() => setFilterRegion(null)}
              className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap bg-gray-800 dark:bg-gray-700 text-white"
            >
              ✕ {filterRegion}
            </button>
          )}
          {uniqueRegions.map(region => (
            <button
              key={region}
              onClick={() => setFilterRegion(filterRegion === region ? null : region)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterRegion === region
                  ? 'bg-mc-red text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-4xl mb-2">🍟</p>
            <p className="text-lg font-display font-semibold text-gray-700 dark:text-gray-300">Nessun McDonald's trovato</p>
            <p className="text-sm">Prova a cambiare i filtri</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold px-1">
              {filtered.length} McDonald's
            </p>
            {filtered.map(mc => (
              <McdonaldCard key={mc.id} mc={mc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
