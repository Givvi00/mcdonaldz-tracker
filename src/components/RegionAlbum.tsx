import { useState } from 'react';
import { SodaGlass } from '@/components/SodaGlass';
import { regionTier, type RegionSummary, type RegionTier } from '@/services/regions';

interface Props {
  summaries: RegionSummary[];
  /** Regions completed at least once (a stored record) */
  wasComplete: ReadonlySet<string>;
}

const TIER_ORDER: Record<RegionTier, number> = { gold: 0, silver: 1, progress: 2, empty: 3 };

const TILE: Record<RegionTier, string> = {
  gold: 'bg-gradient-to-br from-[#FFF6CF] to-[#FFE27A] border-[#3B2A22]',
  silver: 'bg-gradient-to-br from-[#F7F8F9] to-[#DDE1E5] border-[#3B2A22]',
  progress: 'bg-white dark:bg-gray-900 border-[#3B2A22] dark:border-[#6B5546]',
  empty: 'bg-white/60 dark:bg-gray-900/60 border-stone-300 dark:border-stone-700 opacity-70',
};

const STAR: Record<'gold' | 'silver', string> = {
  gold: 'bg-gradient-to-br from-[#FFE27A] to-[#F2AE00]',
  silver: 'bg-gradient-to-br from-[#E4E7EA] to-[#A9B0B7]',
};

/** The regions as a sticker album: gold when complete, silver when a new restaurant opened after you completed it. */
export function RegionAlbum({ summaries, wasComplete }: Props) {
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
        {shown.map(({ s, tier }) => {
          const shiny = tier === 'gold' || tier === 'silver';
          return (
            <div
              key={s.region}
              className={`relative flex flex-col items-center overflow-hidden rounded-2xl border-[3px] p-2 text-center shadow-sm ${TILE[tier]}`}
            >
              {shiny && (
                <span
                  className={`absolute right-1.5 top-1.5 z-[1] flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#3B2A22] text-[0.6rem] text-white ${STAR[tier]}`}
                >
                  ★
                </span>
              )}
              <div className="flex items-center justify-center" style={{ height: 105 }}>
                <SodaGlass region={s.region} percentage={s.total > 0 ? Math.round((s.visited / s.total) * 100) : 0} />
              </div>
              <p className={`mt-1 w-full truncate text-[0.7rem] font-bold ${shiny ? 'text-[#3B2A22]' : 'text-gray-800 dark:text-gray-100'}`}>
                {tier === 'empty' ? '???' : s.region}
              </p>
              <p className={`text-[0.62rem] font-bold ${shiny ? 'text-mc-red' : 'text-mc-red dark:text-red-400'}`}>
                {s.visited}/{s.total}
                {tier === 'silver' ? ` · ${s.total - s.visited} da visitare` : ''}
              </p>
              {shiny && (
                <>
                  <i className={`fig-fx fig-sweep ${tier === 'gold' ? 'fig-sweep-gold' : ''}`} />
                  <i className="fig-fx fig-spark" style={{ top: '14%', left: '14%' }} />
                  <i className="fig-fx fig-spark" style={{ top: '58%', right: '12%', animationDelay: '0.8s' }} />
                  {tier === 'gold' && <i className="fig-fx fig-spark" style={{ top: '22%', right: '24%', animationDelay: '1.5s' }} />}
                </>
              )}
            </div>
          );
        })}
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
