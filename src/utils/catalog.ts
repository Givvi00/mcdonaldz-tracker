import type { McDonald, Visit } from '@shared/types';

/**
 * Which restaurants make up the totals: every open one, plus the closed ones you have visited.
 * A closed restaurant you never visited disappears (it can no longer be conquered); one you did visit stays
 * in your history and keeps counting, so opening/closing never takes away progress or pushes you past 100%.
 */
export function isCounted(mc: McDonald, visitedIds: ReadonlySet<string>): boolean {
  return mc.opened || visitedIds.has(mc.id);
}

const NEW_FOR_DAYS = 30;

/** Opened recently: first seen in the list less than 30 days ago (the original dataset has no addedAt) */
export function isNewlyAdded(mc: McDonald, now: number = Date.now()): boolean {
  if (!mc.addedAt || !mc.opened) return false;
  const added = Date.parse(mc.addedAt);
  return Number.isFinite(added) && now - added >= 0 && now - added < NEW_FOR_DAYS * 24 * 60 * 60 * 1000;
}

export function visitedIdSet(visits: ReadonlyArray<Pick<Visit, 'mcdonaldId'>>): Set<string> {
  return new Set(visits.map(v => v.mcdonaldId));
}

export function countedMcdonalds(mcdonalds: McDonald[], visits: ReadonlyArray<Pick<Visit, 'mcdonaldId'>>): McDonald[] {
  const visited = visitedIdSet(visits);
  return mcdonalds.filter(mc => isCounted(mc, visited));
}
