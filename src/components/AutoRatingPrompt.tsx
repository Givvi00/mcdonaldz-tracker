import { useEffect } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { VisitRatingSheet } from '@/components/VisitRatingSheet';

/**
 * Right after marking a restaurant visited (once its celebration, if any, is fully done), asks you to rate it on
 * the spot instead of leaving it for later. Skipped with the sheet's own ✕, same as any other time you vote.
 */
export function AutoRatingPrompt() {
  const { celebration, celebrationQueue, pendingRatingFor, clearPendingRating, visits, mcdonalds, rateVisit } = useMcdonaldStore();
  const ready = !celebration && celebrationQueue.length === 0 && !!pendingRatingFor;
  const mc = ready ? mcdonalds.find(m => m.id === pendingRatingFor) : undefined;
  const visit = ready ? visits.find(v => v.mcdonaldId === pendingRatingFor) : undefined;

  // The visit was undone (or the restaurant is gone) before its turn came up: nothing to ask about any more
  useEffect(() => {
    if (ready && pendingRatingFor && (!mc || !visit)) clearPendingRating();
  }, [ready, pendingRatingFor, mc, visit, clearPendingRating]);

  if (!ready || !mc || !visit) return null;

  return (
    <VisitRatingSheet
      name={mc.name}
      onSave={rating => void rateVisit(mc.id, rating)}
      onClose={clearPendingRating}
    />
  );
}
