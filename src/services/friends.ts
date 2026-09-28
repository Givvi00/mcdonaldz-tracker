// Friends: everybody signed in sees everybody's summary (supabase/migrations/0005_public_stats.sql). Your app writes
// your own summary after each sync; the Friends page reads everybody's. The summary is only numbers and milestones,
// plus your last visit: never the list of visits, the votes or where you are.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Achievement, McDonald, Visit } from '@shared/types';
import { regionRecordType, regionSummaries, regionTier, type RegionSummary, type RegionTier } from './regions';
import { levelInfo } from '@/utils/foodTheme';

/** One region in the summary, short keys: it travels for every region of every friend */
export interface PublicRegion {
  v: number;
  t: number;
  ver: number;
  vf: number;
  /** Completed at least once (for silver) */
  was?: boolean;
}

export interface PublicStats {
  visited: number;
  verified: number;
  level: number;
  regions: Record<string, PublicRegion>;
  stamps: string[];
  last_visit: { name: string; city: string; at: number } | null;
}

export interface Friend extends PublicStats {
  userId: string;
  name: string;
  updatedAt: string;
}

/** Your summary, from what is on this phone (the same numbers Stats shows) */
export function buildPublicStats(mcdonalds: McDonald[], visits: Visit[], achievements: Achievement[]): PublicStats {
  const byId = new Map(mcdonalds.map(mc => [mc.id, mc]));
  const known = visits.filter(v => byId.has(v.mcdonaldId));
  const types = new Set(achievements.map(a => a.type));
  const regions: Record<string, PublicRegion> = {};
  for (const s of regionSummaries(mcdonalds, visits)) {
    if (s.visited === 0 && !types.has(regionRecordType(s.region))) continue; // untouched regions: the app knows their totals
    regions[s.region] = { v: s.visited, t: s.total, ver: s.verified ?? 0, vf: s.verifiable ?? 0, ...(types.has(regionRecordType(s.region)) && { was: true }) };
  }
  const latest = known.reduce<Visit | null>((best, v) => (!best || v.visitedAt > best.visitedAt ? v : best), null);
  const latestMc = latest ? byId.get(latest.mcdonaldId) : undefined;
  const visited = new Set(known.map(v => v.mcdonaldId)).size;
  return {
    visited,
    verified: known.filter(v => v.verified).length,
    level: levelInfo(visited).number,
    regions,
    // Stamps only: regions have their own stickers above
    stamps: achievements.map(a => a.type).filter(t => !t.includes(':')).sort(),
    last_visit: latest && latestMc ? { name: latestMc.name, city: latestMc.city, at: latest.visitedAt } : null,
  };
}

/** The regions of a friend as the album wants them: every region of the list, the untouched ones at zero */
export function friendRegions(friend: Pick<Friend, 'regions'>, mcdonalds: McDonald[]): { summaries: RegionSummary[]; wasComplete: Set<string>; tiers: Record<string, RegionTier> } {
  const empty = regionSummaries(mcdonalds, []);
  const summaries = empty.map(e => {
    const r = friend.regions[e.region];
    if (!r) return e;
    return { region: e.region, total: r.t, visited: r.v, verified: r.ver, verifiable: r.vf, complete: r.t > 0 && r.v >= r.t };
  });
  const wasComplete = new Set(Object.entries(friend.regions).filter(([, r]) => r.was).map(([region]) => region));
  const tiers = Object.fromEntries(summaries.map(s => [s.region, regionTier(s, wasComplete.has(s.region))]));
  return { summaries, wasComplete, tiers };
}

/** Gold and diamond regions (the ones shown as a count on the card) */
export function doneRegions(friend: Pick<Friend, 'regions'>): { gold: number; diamond: number } {
  let gold = 0;
  let diamond = 0;
  for (const r of Object.values(friend.regions)) {
    if (r.t === 0 || r.v < r.t) continue;
    if (r.vf > 0 && r.ver >= r.vf) diamond += 1;
    else gold += 1;
  }
  return { gold, diamond };
}

const SENT_KEY = 'mcdz-public-sent';

/** Sends your summary if it changed since the last time (checked on this phone, so a sync with nothing new costs nothing) */
export async function publishStats(client: SupabaseClient, accountId: string, stats: PublicStats): Promise<void> {
  const fingerprint = `${accountId}:${JSON.stringify(stats)}`;
  try {
    if (localStorage.getItem(SENT_KEY) === fingerprint) return;
  } catch {
    // storage unavailable: send it anyway
  }
  const { error } = await client.from('public_stats').upsert({ user_id: accountId, ...stats }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
  try {
    localStorage.setItem(SENT_KEY, fingerprint);
  } catch {
    // sent again next time, no harm
  }
}

export async function loadFriends(client: SupabaseClient): Promise<Friend[]> {
  const { data, error } = await client.rpc('friends_board');
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<PublicStats & { user_id: string; name: string; updated_at: string }>).map(row => ({
    userId: row.user_id,
    name: row.name,
    visited: row.visited,
    verified: row.verified,
    level: row.level,
    regions: row.regions ?? {},
    stamps: row.stamps ?? [],
    last_visit: row.last_visit,
    updatedAt: row.updated_at,
  }));
}

// ---- What changed on the leaderboard since you last looked at it (the dot on Amici, "Hai superato…") ----

interface SeenPerson {
  name: string;
  visited: number;
  verified: number;
}

/** The leaderboard as it was the last time you opened Amici */
export interface BoardSnapshot {
  account: string;
  people: Record<string, SeenPerson>;
}

export type FriendNews =
  | { kind: 'joined'; userId: string; name: string }
  /** was behind you, now ahead */
  | { kind: 'passedYou'; userId: string; name: string }
  /** was ahead of you, now behind */
  | { kind: 'youPassed'; userId: string; name: string };

/** Ahead on the leaderboard: more restaurants, then more verified */
const ahead = (a: SeenPerson, b: SeenPerson) => a.visited > b.visited || (a.visited === b.visited && a.verified > b.verified);

export function snapshotOf(friends: Friend[], account: string): BoardSnapshot {
  return { account, people: Object.fromEntries(friends.map(f => [f.userId, { name: f.name, visited: f.visited, verified: f.verified }])) };
}

/** Nothing the first time (no snapshot, or another account): there is nothing to compare with */
export function boardNews(previous: BoardSnapshot | null, friends: Friend[], account: string): FriendNews[] {
  if (!previous || previous.account !== account) return [];
  const meBefore = previous.people[account];
  const meNow = friends.find(f => f.userId === account);
  const news: FriendNews[] = [];
  for (const f of friends) {
    if (f.userId === account) continue;
    const before = previous.people[f.userId];
    if (!before) {
      news.push({ kind: 'joined', userId: f.userId, name: f.name });
      continue;
    }
    if (!meBefore || !meNow) continue;
    const wasAhead = ahead(before, meBefore);
    const isAhead = ahead(f, meNow);
    if (!wasAhead && isAhead) news.push({ kind: 'passedYou', userId: f.userId, name: f.name });
    if (wasAhead && !isAhead) news.push({ kind: 'youPassed', userId: f.userId, name: f.name });
  }
  return news;
}

/** Your place by restaurants visited (1 = first) */
export function placeOf(friends: Friend[], account: string): number {
  const me = friends.find(f => f.userId === account);
  return me ? friends.filter(f => f.userId !== account && ahead(f, me)).length + 1 : 0;
}
