import type { McDonald } from '@shared/types';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { formatDistance } from '@/utils/geo';
import { isNewlyAdded } from '@/utils/catalog';
import { shortMcName } from '@/utils/format';
import { restaurantKind } from '@/utils/foodTheme';

interface Props {
  mc: McDonald;
  distanceKm?: number;
  variant?: 'list' | 'compact';
}

export function McdonaldCard({ mc, distanceKm, variant = 'list' }: Props) {
  const { isVisited, toggleVisit, focusOnMap } = useMcdonaldStore();
  const visited = isVisited(mc.id);
  const kind = restaurantKind(mc);

  if (variant === 'compact') {
    return (
      <div
        className={`flex-shrink-0 w-40 flex flex-col text-left rounded-2xl border transition-all shadow-sm ${
          visited
            ? 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-mc-red dark:hover:border-mc-red'
        }`}
      >
        <button
          onClick={() => toggleVisit(mc.id)}
          className="text-left p-3 pb-2 active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ring-2 ring-white dark:ring-gray-900 ${
                visited ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-mc-red to-red-700'
              }`}
            >
              {visited ? '✓' : 'M'}
            </span>
            {distanceKm !== undefined && (
              <span className="text-[0.65rem] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {formatDistance(distanceKm)}
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
            {kind && <span title={kind.label} className="mr-1">{kind.emoji}</span>}
            {shortMcName(mc.name)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{mc.city}</p>
        </button>
        <button
          onClick={() => focusOnMap(mc.id)}
          className="mt-auto mx-3 mb-3 flex items-center justify-center gap-1 text-xs font-semibold text-mc-red bg-mc-red/10 dark:bg-mc-red/20 py-1.5 rounded-full active:scale-[0.96] transition-transform"
        >
          🗺️ Sulla mappa
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
        visited
          ? 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-mc-red dark:hover:border-mc-red hover:shadow-md'
      }`}
      onClick={() => toggleVisit(mc.id)}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
            {kind && <span title={kind.label} className="mr-1">{kind.emoji}</span>}
            {mc.name}
            {!mc.opened && (
              <span className="ml-2 align-middle text-[0.6rem] font-bold uppercase tracking-wide text-white bg-stone-500 rounded-full px-2 py-0.5">
                Chiuso
              </span>
            )}
            {isNewlyAdded(mc) && (
              <span className="ml-2 align-middle text-[0.6rem] font-bold uppercase tracking-wide text-gray-800 bg-mc-yellow rounded-full px-2 py-0.5">
                Nuovo
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{mc.city}, {mc.region}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{mc.address}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900 ${
              visited ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            {visited ? '✓' : '○'}
          </div>
          {distanceKm !== undefined && (
            <span className="text-[0.65rem] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
