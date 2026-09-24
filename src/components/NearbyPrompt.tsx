import { useEffect, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { distanceKm, formatDistance } from '@/utils/geo';
import { shortMcName } from '@/utils/format';
import type { McDonald } from '@shared/types';
import { VerifiedBadge } from '@/components/VerifiedBadge';

/** How close a restaurant must seem for "Ti trovi qui?" (the position is refreshed while the app is in use) */
const NEARBY_RADIUS_KM = 0.5;
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

/** "new": a restaurant you have not marked yet. "again": one you marked without being verified, and now you are there */
type Suggestion = { mc: McDonald; km: number; kind: 'new' | 'again' };

/**
 * When you seem to be at a restaurant, asks about it: mark the visit, or verify one you had marked by hand. Looked at
 * again every time the position is refreshed; each restaurant is asked about at most once per session.
 */
export function NearbyPrompt() {
  const { user, mcdonalds, visits, userPosition, locationStatus, toggleVisit, verifyVisit, celebration, pendingRatingFor, unmarkRequest, onboarding } =
    useMcdonaldStore();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    // Never on top of something else going on (a celebration, the rating sheet, a confirmation)
    if (suggestion || celebration || pendingRatingFor || unmarkRequest || onboarding !== 'done') return;
    // `user` is there once your visits are loaded: before that every restaurant would look new
    if (!user || locationStatus !== 'granted' || !userPosition || mcdonalds.length === 0) return;

    const dismissed = getDismissed();
    const byId = new Map(visits.map(v => [v.mcdonaldId, v]));
    const nearest = mcdonalds
      .filter(mc => mc.opened && !dismissed.has(mc.id) && !byId.get(mc.id)?.verified)
      .map(mc => ({ mc, km: distanceKm(userPosition.lat, userPosition.lon, mc.lat, mc.lon) }))
      .sort((a, b) => a.km - b.km)[0];

    if (nearest && nearest.km <= NEARBY_RADIUS_KM) {
      setSuggestion({ ...nearest, kind: byId.has(nearest.mc.id) ? 'again' : 'new' });
    }
  }, [user, locationStatus, userPosition, mcdonalds, visits, suggestion, celebration, pendingRatingFor, unmarkRequest, onboarding]);

  const dismiss = () => {
    if (suggestion) markDismissed(suggestion.mc.id);
    setSuggestion(null);
  };

  const confirm = () => {
    if (suggestion) {
      markDismissed(suggestion.mc.id);
      if (suggestion.kind === 'new') void toggleVisit(suggestion.mc.id);
      else void verifyVisit(suggestion.mc.id);
    }
    setSuggestion(null);
  };

  if (!suggestion) return null;
  const visit = visits.find(v => v.mcdonaldId === suggestion.mc.id);
  // Things changed in the meantime (marked from a card, or verified): nothing left to ask
  if ((suggestion.kind === 'new' && visit) || visit?.verified) return null;
  const again = suggestion.kind === 'again';

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center bg-black/40 px-4 sm:pb-4"
      style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-label={again ? 'Sei di nuovo qui?' : 'Ti trovi qui?'}
        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 animate-[toast-in_0.35s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          {again ? (
            <VerifiedBadge size={44} />
          ) : (
            <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-mc-red to-red-700 text-mc-yellow text-2xl shadow-sm flex-shrink-0">
              📍
            </span>
          )}
          <div className="min-w-0">
            <p className="font-display font-bold text-gray-800 dark:text-gray-100">{again ? 'Sei di nuovo qui?' : 'Ti trovi qui?'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {shortMcName(suggestion.mc.name)} è a {formatDistance(suggestion.km)} da te
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {again
            ? 'L’avevi già segnato, ma la visita non è verificata: fallo adesso che sei qui.'
            : 'Visita un nuovo Mc e segna la conquista! 🎉'}
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
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm active:scale-[0.97] transition-transform ${
              again ? 'bg-blue-600' : 'bg-mc-red'
            }`}
          >
            {again ? 'Verifica ✓' : 'Segna visita ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
