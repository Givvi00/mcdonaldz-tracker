import type { McDonald } from '@shared/types';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { formatDistance } from '@/utils/geo';
import { shortMcName } from '@/utils/format';

interface Props {
  mc: McDonald;
  distanceKm?: number;
  variant?: 'list' | 'compact';
}

export function McdonaldCard({ mc, distanceKm, variant = 'list' }: Props) {
  const { isVisited, toggleVisit } = useMcdonaldStore();
  const visited = isVisited(mc.id);

  if (variant === 'compact') {
    return (
      <button
        onClick={() => toggleVisit(mc.id)}
        className={`flex-shrink-0 w-40 text-left p-3 rounded-2xl border transition-all shadow-sm active:scale-[0.97] ${
          visited
            ? 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-mc-red dark:hover:border-mc-red hover:-translate-y-0.5'
        }`}
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
        <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{shortMcName(mc.name)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{mc.city}</p>
      </button>
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
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{mc.name}</h3>
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
