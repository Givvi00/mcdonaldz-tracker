import type { Visit } from '@shared/types';

// How many times you went to a restaurant. The first visit is the one you marked; every later one is counted by
// itself: when you open the app there and the GPS confirms it (services/gpsCheck), at most once every 4 hours, so
// lunch and dinner count as two and reopening the app does not inflate it. Nothing is added by hand.

export const CHECKIN_GAP_MS = 4 * 60 * 60 * 1000;
/** A safety cap on the list kept for each restaurant */
export const MAX_CHECKINS = 1000;

export const visitCount = (visit: Pick<Visit, 'checkins'>): number => 1 + (visit.checkins?.length ?? 0);

/** The last time you were counted there */
export function lastCounted(visit: Pick<Visit, 'visitedAt' | 'checkins'>): number {
  return Math.max(visit.visitedAt, ...(visit.checkins ?? []));
}

/** Whether being there now is a new visit */
export const canCheckIn = (visit: Pick<Visit, 'visitedAt' | 'checkins'>, now: number): boolean => now - lastCounted(visit) >= CHECKIN_GAP_MS;

/** The visit with one more return at `at` (it also becomes verified: you were there) */
export function withCheckin(visit: Visit, at: number): Visit {
  const checkins = [...(visit.checkins ?? []), at].slice(-MAX_CHECKINS);
  return { ...visit, checkins, ...(!visit.verified && { verified: true, verifiedAt: at }) };
}
