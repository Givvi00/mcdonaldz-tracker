import type { McDonald, Visit } from '@shared/types';
import { getAchievements, addAchievement } from './db';
import { countedMcdonalds, visitedIdSet } from '@/utils/catalog';

// A region is complete when every restaurant that counts there is visited: the open ones, plus the closed ones you
// visited. The first time it happens the completion is remembered (a "REGION:<name>" record next to the stamps), so
// a region that later gets a new restaurant can show as silver (was complete, one to go) and turn gold again.
// A complete region where every open restaurant has a verified visit (you were really there) is a diamond one. Closed
// restaurants do not count for it: you cannot go back to verify them, and they must not block the diamond for ever.

export interface RegionSummary {
  region: string;
  total: number;
  visited: number;
  complete: boolean;
  /** Open restaurants with a verified visit, and open restaurants in all (what the diamond is measured on) */
  verified?: number;
  verifiable?: number;
}

export type RegionTier = 'diamond' | 'gold' | 'silver' | 'progress' | 'empty';

export const regionRecordType = (region: string) => `REGION:${region}`;
export const diamondRecordType = (region: string) => `DIAMOND:${region}`;

export const isDiamond = (s: RegionSummary) => s.complete && (s.verifiable ?? 0) > 0 && s.verified === s.verifiable;

export function regionSummaries(mcdonalds: McDonald[], visits: Visit[]): RegionSummary[] {
  const visitedIds = visitedIdSet(visits);
  const verifiedIds = new Set(visits.filter(v => v.verified).map(v => v.mcdonaldId));
  const byRegion = new Map<string, { total: number; visited: number; verified: number; verifiable: number }>();
  for (const mc of countedMcdonalds(mcdonalds, visits)) {
    const entry = byRegion.get(mc.region) ?? { total: 0, visited: 0, verified: 0, verifiable: 0 };
    entry.total += 1;
    if (visitedIds.has(mc.id)) entry.visited += 1;
    if (mc.opened) {
      entry.verifiable += 1;
      if (verifiedIds.has(mc.id)) entry.verified += 1;
    }
    byRegion.set(mc.region, entry);
  }
  return [...byRegion.entries()].map(([region, e]) => ({ region, ...e, complete: e.total > 0 && e.visited === e.total }));
}

export function completedRegions(mcdonalds: McDonald[], visits: Visit[]): string[] {
  return regionSummaries(mcdonalds, visits)
    .filter(r => r.complete)
    .map(r => r.region);
}

/** Diamond: complete and all verified. Gold: complete now. Silver: was complete, something new to visit. */
export function regionTier(summary: RegionSummary, wasComplete: boolean): RegionTier {
  if (isDiamond(summary)) return 'diamond';
  if (summary.complete) return 'gold';
  if (wasComplete) return 'silver';
  return summary.visited > 0 ? 'progress' : 'empty';
}

/**
 * Remembers every region that is complete now. Returns the summary of `touchedRegion` if this visit just completed it
 * for the first time (worth a celebration); regions completed some other way are recorded quietly.
 */
export async function syncRegionCompletions(
  userId: string,
  mcdonalds: McDonald[],
  visits: Visit[],
  touchedRegion?: string,
): Promise<RegionSummary | null> {
  const known = new Set((await getAchievements(userId)).map(a => a.type));
  let celebrate: RegionSummary | null = null;
  for (const summary of regionSummaries(mcdonalds, visits)) {
    if (!summary.complete || known.has(regionRecordType(summary.region))) continue;
    await addAchievement({
      id: `ach_${Date.now()}_${summary.region}`,
      userId,
      type: regionRecordType(summary.region),
      unlockedAt: Date.now(),
    });
    if (summary.region === touchedRegion) celebrate = summary;
  }
  return celebrate;
}

/**
 * Remembers every region that is diamond now (a "DIAMOND:<name>" record). Returns the summary of `touchedRegion` if it
 * just became diamond for the first time (worth a celebration); the others are recorded quietly.
 */
export async function syncDiamondRegions(
  userId: string,
  mcdonalds: McDonald[],
  visits: Visit[],
  touchedRegion?: string,
): Promise<RegionSummary | null> {
  const known = new Set((await getAchievements(userId)).map(a => a.type));
  let celebrate: RegionSummary | null = null;
  for (const summary of regionSummaries(mcdonalds, visits)) {
    if (!isDiamond(summary) || known.has(diamondRecordType(summary.region))) continue;
    await addAchievement({
      id: `ach_${Date.now()}_diamond_${summary.region}`,
      userId,
      type: diamondRecordType(summary.region),
      unlockedAt: Date.now(),
    });
    if (summary.region === touchedRegion) celebrate = summary;
  }
  return celebrate;
}
