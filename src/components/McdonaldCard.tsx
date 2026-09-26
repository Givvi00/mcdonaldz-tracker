import { useState } from 'react';
import type { McDonald } from '@shared/types';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { formatDistance } from '@/utils/geo';
import { isNewlyAdded } from '@/utils/catalog';
import { shortMcName } from '@/utils/format';
import { restaurantKind } from '@/utils/foodTheme';
import { canOfferVerify } from '@/services/gpsCheck';
import { VisitDateSheet, formatVisitDate } from '@/components/VisitDateSheet';
import { VisitRatingSheet, averageRating } from '@/components/VisitRatingSheet';
import { VisitDiarySheet } from '@/components/VisitDiarySheet';
import { menuItems } from '@/utils/menu';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface Props {
  mc: McDonald;
  distanceKm?: number;
  variant?: 'list' | 'compact';
}

// Card colours by state: to visit, visited, visited and confirmed by the GPS
const CARD_TONE = {
  none: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-mc-red dark:hover:border-mc-red',
  visited: 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800',
  verified: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800',
};

export function McdonaldCard({ mc, distanceKm, variant = 'list' }: Props) {
  const { isVisited, requestToggle, focusOnMap, visits, changeVisitDate, rateVisit, saveDiary, userPosition, verifying, verifyVisit } =
    useMcdonaldStore();
  const [editingDate, setEditingDate] = useState(false);
  const [editingRating, setEditingRating] = useState(false);
  const [editingDiary, setEditingDiary] = useState(false);
  const visited = isVisited(mc.id);
  const visit = visited ? visits.find(v => v.mcdonaldId === mc.id) : undefined;
  const kind = restaurantKind(mc);
  const tone = visit?.verified ? CARD_TONE.verified : visited ? CARD_TONE.visited : CARD_TONE.none;
  const offerVerify = canOfferVerify(visit, mc, userPosition);
  const checking = verifying.includes(mc.id);

  const verifyButton = (className: string) => (
    <button
      disabled={checking}
      onClick={e => {
        e.stopPropagation();
        void verifyVisit(mc.id);
      }}
      className={`items-center justify-center gap-1 rounded-full border border-blue-400 bg-white font-semibold text-blue-700 active:scale-95 disabled:opacity-60 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ${className}`}
    >
      {checking ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /> Verifica…
        </>
      ) : (
        <>📍 Verifica ora</>
      )}
    </button>
  );

  if (variant === 'compact') {
    return (
      <div className={`flex-shrink-0 w-40 flex flex-col text-left rounded-2xl border transition-all shadow-sm ${tone}`}>
        <button onClick={() => requestToggle(mc.id)} className="text-left p-3 pb-2 active:scale-[0.97] transition-transform">
          <div className="flex h-8 items-center justify-between mb-1.5">
            {visit?.verified ? (
              <span title="Visita verificata: eri lì" className="-ml-1">
                <VerifiedBadge size={34} />
              </span>
            ) : (
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ring-2 ring-white dark:ring-gray-900 ${
                  visited ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-mc-red to-red-700'
                }`}
              >
                {visited ? '✓' : 'M'}
              </span>
            )}
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
        <div className="mt-auto mx-3 mb-3 flex flex-col gap-1.5">
          {offerVerify && verifyButton('flex py-1.5 text-xs')}
          <button
            onClick={() => focusOnMap(mc.id)}
            className="flex items-center justify-center gap-1 text-xs font-semibold text-mc-red bg-mc-red/10 dark:bg-mc-red/20 py-1.5 rounded-full active:scale-[0.96] transition-transform"
          >
            🗺️ Sulla mappa
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm active:scale-[0.98] ${tone} ${visited ? '' : 'hover:shadow-md'}`}
        onClick={() => requestToggle(mc.id)}
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mc.address}</p>
            {visit && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {visit.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[0.7rem] font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                    📅 Visitato il {formatVisitDate(visit.visitedAt)}
                  </span>
                ) : (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingDate(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[0.7rem] font-semibold text-green-800 active:scale-95 dark:bg-green-900/40 dark:text-green-300"
                  >
                    📅 Visitato il {formatVisitDate(visit.visitedAt)}
                    <span className="opacity-60">· Cambia</span>
                  </button>
                )}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setEditingRating(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-mc-yellow/25 px-2.5 py-1 text-[0.7rem] font-semibold text-yellow-800 active:scale-95 dark:bg-mc-yellow/15 dark:text-mc-yellow"
                >
                  {visit.rating ? <>★ {averageRating(visit.rating).toFixed(1)}</> : <>☆ Vota</>}
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setEditingDiary(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[0.7rem] font-semibold text-orange-800 active:scale-95 dark:bg-orange-900/40 dark:text-orange-200"
                >
                  📓 {visit.ate?.length || visit.notes ? 'Diario' : 'Scrivi il diario'}
                </button>
                {offerVerify && verifyButton('inline-flex px-2.5 py-1 text-[0.7rem]')}
              </div>
            )}
            {visit && (menuItems(visit.ate).length > 0 || visit.notes) && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setEditingDiary(true);
                }}
                className="mt-2 block w-full rounded-xl bg-white/70 px-3 py-2 text-left text-xs text-gray-700 active:scale-[0.99] dark:bg-black/20 dark:text-gray-200"
              >
                {menuItems(visit.ate).length > 0 && (
                  <span className="block">
                    {menuItems(visit.ate)
                      .map(item => `${item.emoji} ${item.label}`)
                      .join(' · ')}
                  </span>
                )}
                {visit.notes && <span className="mt-0.5 block italic text-gray-600 line-clamp-2 dark:text-gray-300">“{visit.notes}”</span>}
              </button>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {visit?.verified ? (
              <div title="Visita verificata: eri lì">
                <VerifiedBadge size={38} />
              </div>
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900 ${
                  visited ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gray-300 dark:bg-gray-700'
                } ${checking ? 'animate-pulse' : ''}`}
              >
                {visited ? '✓' : '○'}
              </div>
            )}
            {distanceKm !== undefined && (
              <span className="text-[0.65rem] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                {formatDistance(distanceKm)}
              </span>
            )}
          </div>
        </div>
      </div>
      {editingDate && visit && (
        <VisitDateSheet
          name={mc.name}
          visitedAt={visit.visitedAt}
          onSave={ms => void changeVisitDate(mc.id, ms)}
          onClose={() => setEditingDate(false)}
        />
      )}
      {editingDiary && visit && (
        <VisitDiarySheet
          name={mc.name}
          initialAte={visit.ate}
          initialNotes={visit.notes}
          onSave={diary => void saveDiary(mc.id, diary)}
          onClose={() => setEditingDiary(false)}
        />
      )}
      {editingRating && visit && (
        <VisitRatingSheet
          name={mc.name}
          initial={visit.rating}
          onSave={rating => void rateVisit(mc.id, rating)}
          onClose={() => setEditingRating(false)}
        />
      )}
    </>
  );
}
