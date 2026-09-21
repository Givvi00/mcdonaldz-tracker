import { useState } from 'react';
import { RegionSticker } from '@/components/RegionSticker';
import { regionTier, type RegionSummary, type RegionTier } from '@/services/regions';

interface Props {
  summaries: RegionSummary[];
  /** Regions completed at least once (a stored record) */
  wasComplete: ReadonlySet<string>;
  /** When each region was first completed (ms), by region name */
  completedAt: Record<string, number>;
}

const TIER_ORDER: Record<RegionTier, number> = { gold: 0, silver: 1, progress: 2, empty: 3 };

/** The regions as a sticker album: gold when complete, silver when a new restaurant opened after you completed it. */
export function RegionAlbum({ summaries, wasComplete, completedAt }: Props) {
  const tiles = summaries
    .map(s => ({ s, tier: regionTier(s, wasComplete.has(s.region)) }))
    .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || b.s.visited / b.s.total - a.s.visited / a.s.total || a.s.region.localeCompare(b.s.region));
  const done = tiles.filter(t => t.tier === 'gold').length;
  const [showAll, setShowAll] = useState(false);
  const unstarted = tiles.filter(t => t.tier === 'empty').length;
  const shown = showAll ? tiles : tiles.filter(t => t.tier !== 'empty');

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        Regioni completate: <span className="font-bold text-mc-red dark:text-red-400">{done}</span> su {tiles.length}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {shown.map(({ s, tier }) => (
          <RegionSticker key={s.region} summary={s} tier={tier} completedAt={completedAt[s.region]} />
        ))}
      </div>
      {unstarted > 0 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-3 w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-gray-600 transition-transform active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          {showAll ? 'Nascondi le regioni da scoprire' : `Mostra le ${unstarted} regioni da scoprire`}
        </button>
      )}
    </div>
  );
}
