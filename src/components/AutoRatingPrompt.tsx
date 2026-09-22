import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { VisitRatingSheet } from '@/components/VisitRatingSheet';

/**
 * Right when a restaurant is marked visited, asks you to rate it on the spot instead of leaving it for later: the
 * sheet appears together with (or a beat before) whatever celebration plays, sitting above its veil so both are
 * usable at once, rather than waiting for a long level/region/stamp show to finish first.
 */
export function AutoRatingPrompt() {
  const { pendingRatingFor, clearPendingRating, visits, mcdonalds, rateVisit } = useMcdonaldStore();
  const mc = pendingRatingFor ? mcdonalds.find(m => m.id === pendingRatingFor) : undefined;
  const visit = pendingRatingFor ? visits.find(v => v.mcdonaldId === pendingRatingFor) : undefined;

  // The visit was undone before you got to it: nothing to ask about any more
  useEffect(() => {
    if (pendingRatingFor && (!mc || !visit)) clearPendingRating();
  }, [pendingRatingFor, mc, visit, clearPendingRating]);

  if (!pendingRatingFor || !mc || !visit) return null;

  return (
    <VisitRatingSheet
      name={mc.name}
      aboveCelebration
      onSave={rating => void rateVisit(mc.id, rating)}
      onClose={clearPendingRating}
    />
  );
}
