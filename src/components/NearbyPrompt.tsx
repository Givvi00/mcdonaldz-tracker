import { useEffect, useRef, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { distanceKm, formatDistance } from '@/utils/geo';
import { shortMcName } from '@/utils/format';
import type { McDonald } from '@shared/types';

const NEARBY_RADIUS_KM = 2;
const DISMISSED_KEY = 'mcdz_nearby_dismissed';

function getDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function markDismissed(id: string) {
  const dismissed = getDismissed();
  dismissed.add(id);
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  } catch {
    // storage unavailable, ignore
  }
}

export function NearbyPrompt() {
  const { mcdonalds, userPosition, locationStatus, isVisited, toggleVisit } = useMcdonaldStore();
  const [nearby, setNearby] = useState<{ mc: McDonald; km: number } | null>(null);
  const candidate = nearby?.mc ?? null;
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    if (locationStatus !== 'granted' || !userPosition || mcdonalds.length === 0) return;
    checkedRef.current = true;

    const dismissed = getDismissed();
    const nearest = mcdonalds
      .filter(mc => mc.opened && !isVisited(mc.id) && !dismissed.has(mc.id))
      .map(mc => ({ mc, d: distanceKm(userPosition.lat, userPosition.lon, mc.lat, mc.lon) }))
      .sort((a, b) => a.d - b.d)[0];

    if (nearest && nearest.d <= NEARBY_RADIUS_KM) {
      setNearby({ mc: nearest.mc, km: nearest.d });
    }
  }, [locationStatus, userPosition, mcdonalds, isVisited]);

  const dismiss = () => {
    if (candidate) markDismissed(candidate.id);
    setNearby(null);
  };

  const confirm = () => {
    if (candidate) {
      toggleVisit(candidate.id);
      markDismissed(candidate.id);
    }
    setNearby(null);
  };

  if (!nearby || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-4"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 animate-[toast-in_0.35s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-mc-red to-red-700 text-mc-yellow text-2xl shadow-sm flex-shrink-0">
            📍
          </span>
          <div className="min-w-0">
            <p className="font-display font-bold text-gray-800 dark:text-gray-100">Ti trovi qui?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {shortMcName(candidate.name)} è a {formatDistance(nearby.km)} da te
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Visita un nuovo Mc e segna la conquista! 🎉
        </p>
        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-[0.97] transition-transform"
          >
            Non ora
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-mc-red text-white shadow-sm active:scale-[0.97] transition-transform"
          >
            Segna visita ✓
          </button>
        </div>
      </div>
    </div>
  );
}
