import { useRef, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { McdonaldCard } from '@/components/McdonaldCard';
import { RegionSheet } from '@/components/RegionSheet';
import { StatusFilter } from '@/components/StatusFilter';
import { InstallPrompt } from '@/components/InstallPrompt';
import { SodaGlass } from '@/components/SodaGlass';
import { distanceKm } from '@/utils/geo';
import { FoodPattern } from '@/components/FoodPattern';
import { FoodProgressBar } from '@/components/FoodProgressBar';
import { LevelPill } from '@/components/LevelPill';
import { EmptyTray } from '@/components/Tray';

type SortBy = 'distance' | 'name';

export function Home() {
  const {
    filterRegion,
    setFilterRegion,
    filterVisited,
    setFilterVisited,
    getFilteredMcdonalds,
    isVisited,
    getRegionStats,
    userPosition,
    getVisitedCount,
    getCountedTotal,
    getNearestMcdonalds,
    getTopRegions,
    locationStatus,
    setSelectedTab,
    focusOnMap,
  } = useMcdonaldStore();

  const listRef = useRef<HTMLDivElement>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const canSortByDistance = userPosition !== null;
  const sortByDistance = sortBy === 'distance' && canSortByDistance;

  const matching = getFilteredMcdonalds();
  const filtered = userPosition
    ? matching
        .map(mc => ({ ...mc, distanceKm: distanceKm(userPosition.lat, userPosition.lon, mc.lat, mc.lon) }))
    : matching.map(mc => ({ ...mc, distanceKm: undefined as number | undefined }));
  if (sortByDistance) {
    filtered.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }
  const regionStats = getRegionStats()
    .slice()
    .sort((a, b) => a.region.localeCompare(b.region, 'it'));
  // With a region selected (and no visited/unvisited filter), list the visited ones first in their own group
  const splitVisited = filterRegion !== null && filterVisited === null;
  const visitedInRegion = splitVisited ? filtered.filter(mc => isVisited(mc.id)) : [];
  const remaining = splitVisited ? filtered.filter(mc => !isVisited(mc.id)) : filtered;
  const visitedCount = getVisitedCount();
  const total = getCountedTotal();
  const percentage = total > 0 ? Math.round((visitedCount / total) * 100) : 0;
  const nearest = getNearestMcdonalds(4);
  const topRegions = getTopRegions(3);

  const jumpToRegion = (region: string) => {
    setFilterRegion(filterRegion === region ? null : region);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const findNearest = () => {
    // The closest open McDonald's, whether or not it is already visited
    const [closest] = getNearestMcdonalds(1);
    if (closest) focusOnMap(closest.id);
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Hero progress */}
      <button
        onClick={() => setSelectedTab('stats')}
        className="relative mx-4 mt-4 text-left bg-gradient-to-br from-mc-red to-red-700 text-white rounded-3xl p-5 shadow-lg shadow-red-900/20 active:scale-[0.99] transition-transform overflow-hidden"
      >
        <FoodPattern />
        <div className="relative">
          <p className="text-xs font-display font-semibold uppercase tracking-wide opacity-80">Il tuo progresso</p>
          <div className="flex items-end gap-3 mt-1">
            <p className="text-4xl font-display font-bold">{visitedCount}</p>
            <p className="text-sm opacity-80 mb-1">/ {total} McDonald's · {percentage}%</p>
          </div>
          <FoodProgressBar percentage={percentage} />
          <LevelPill visited={visitedCount} />
        </div>
      </button>

      <InstallPrompt />

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
              className="flex items-center gap-1 text-xs font-semibold text-mc-red dark:text-red-400 bg-mc-red/10 dark:bg-mc-red/20 px-3 py-1.5 rounded-full active:scale-[0.96] transition-transform"
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
                  <SodaGlass region={r.region} percentage={r.percentage} />
                </div>
                <div className="mt-1.5">
                  <p className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate w-full">{r.region}</p>
                  <p className="text-[0.65rem] font-bold text-mc-red dark:text-red-400">{r.visited}/{r.total} · {r.percentage}%</p>
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

        {/* Stato: visitati / da visitare */}
        <StatusFilter value={filterVisited} onChange={setFilterVisited} className="mb-3" />

        {/* Regione + ordinamento */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSheetOpen(true)}
            className={`flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
              filterRegion
                ? 'bg-mc-red/10 dark:bg-mc-red/20 border-mc-red text-mc-red dark:text-red-400'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            <span className="truncate">📍 {filterRegion ?? 'Tutte le regioni'}</span>
            <span className="text-xs opacity-70">▾</span>
          </button>
          {filterRegion && (
            <button
              onClick={() => setFilterRegion(null)}
              aria-label="Rimuovi filtro regione"
              className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 text-sm"
            >
              ✕
            </button>
          )}
          <div className="flex flex-shrink-0 gap-0.5 p-0.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
            <button
              onClick={() => setSortBy('distance')}
              disabled={!canSortByDistance}
              className={`px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40 ${
                sortByDistance
                  ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Distanza
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                !sortByDistance
                  ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              A–Z
            </button>
          </div>
        </div>

        <RegionSheet
          open={sheetOpen}
          regions={regionStats}
          selected={filterRegion}
          onSelect={setFilterRegion}
          onClose={() => setSheetOpen(false)}
        />

        {filtered.length === 0 ? (
          <EmptyTray title="Il vassoio è vuoto" hint="Nessun McDonald's con questi filtri: prova a cambiarli" />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold px-1">
              {filtered.length} McDonald's
            </p>
            {visitedInRegion.length > 0 && (
              <>
                <p className="text-xs font-display font-semibold text-green-700 dark:text-green-400 px-1 pt-1">
                  ✓ Già visitati in {filterRegion} · {visitedInRegion.length}
                </p>
                {visitedInRegion.map(mc => (
                  <McdonaldCard key={mc.id} mc={mc} distanceKm={sortByDistance ? mc.distanceKm : undefined} />
                ))}
                {remaining.length > 0 && (
                  <p className="text-xs font-display font-semibold text-gray-500 dark:text-gray-400 px-1 pt-3">
                    Da visitare · {remaining.length}
                  </p>
                )}
              </>
            )}
            {remaining.map(mc => (
              <McdonaldCard key={mc.id} mc={mc} distanceKm={sortByDistance ? mc.distanceKm : undefined} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
