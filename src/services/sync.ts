// Keeps the visits, stamps and name on this phone and the online copy of the account in step.
//
// The phone stays the place where the app works (offline too): the online copy follows it. A sync:
//   1. sends what changed here since the last one (the outbox, see syncOutbox.ts): visits added, changed or removed;
//   2. merges the stamps both ways (once earned, never taken back);
//   3. takes the online visits for everything not changed here in the meantime: what another phone did arrives.
// The first sync of an account on a phone sends every visit it has, so nothing kept only here is lost: the two sets
// are joined (and for a restaurant in both, the phone's version wins).
import type { Achievement, Visit, VisitRating } from '@shared/types';
import { NAME_ENTRY, clearSent, readOutbox, type Outbox } from './syncOutbox';

/** A visit as the online copy keeps it (see supabase/migrations/0001_account.sql) */
export interface RemoteVisit {
  mcdonald_id: string;
  visited_at: number;
  date_edited: boolean;
  verified: boolean;
  verified_at: number | null;
  rating: VisitRating | null;
}

/** The name is already used by another account (names are unique online) */
export class NameTakenError extends Error {
  constructor(public readonly taken: string) {
    super(`«${taken}» è già preso: scegline un altro`);
  }
}

export interface RemoteAchievement {
  type: string;
  unlocked_at: number;
  value: number | null;
}

/** The online copy of one account */
export interface Remote {
  listVisits(): Promise<RemoteVisit[]>;
  upsertVisits(rows: RemoteVisit[]): Promise<void>;
  deleteVisits(mcdonaldIds: string[]): Promise<void>;
  listAchievements(): Promise<RemoteAchievement[]>;
  /** Adds the ones missing, leaves those already there as they are */
  addAchievements(rows: RemoteAchievement[]): Promise<void>;
  /** undefined: no profile yet */
  getName(): Promise<string | null | undefined>;
  /** Throws NameTakenError if another account has it */
  setName(name: string | null): Promise<void>;
}

/** The data on this phone */
export interface Local {
  getVisits(): Promise<Visit[]>;
  replaceVisits(online: Visit[], keepLocal: () => Set<string>): Promise<boolean>;
  getAchievements(): Promise<Achievement[]>;
  addMissingAchievements(earned: Array<Pick<Achievement, 'type' | 'unlockedAt' | 'value'>>): Promise<number>;
  getName(): Promise<string | undefined>;
  setNameFromServer(name: string | undefined): Promise<void>;
}

export function toRemote(visit: Visit): RemoteVisit {
  return {
    mcdonald_id: visit.mcdonaldId,
    visited_at: visit.visitedAt,
    date_edited: visit.dateEdited === true,
    verified: visit.verified === true,
    verified_at: visit.verifiedAt ?? null,
    rating: visit.rating ?? null,
  };
}

/** Only the fields that are set, exactly as the app writes them itself */
export function fromRemote(row: RemoteVisit): Visit {
  const visit: Visit = { id: `visit_${row.mcdonald_id}`, mcdonaldId: row.mcdonald_id, visitedAt: Number(row.visited_at) };
  if (row.date_edited) visit.dateEdited = true;
  if (row.verified) visit.verified = true;
  if (row.verified_at != null) visit.verifiedAt = Number(row.verified_at);
  if (row.rating) visit.rating = row.rating;
  return visit;
}

// Which account this phone last synced with: a different one (or the first) gets a full send
const ACCOUNT_KEY = 'mcdz-sync-account';

export function syncedAccount(): string | null {
  try {
    return localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return null;
  }
}

/** After deleting the account: whatever signs in next here starts with a full send */
export function forgetSyncedAccount(): void {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    // storage unavailable: nothing to forget
  }
}

function rememberAccount(accountId: string): void {
  try {
    localStorage.setItem(ACCOUNT_KEY, accountId);
  } catch {
    // storage unavailable: the next sync is a full one again, which is safe
  }
}

export interface SyncResult {
  /** Something arrived from the online copy: the app has to read its data again */
  changedHere: boolean;
  /** Stamps that arrived from another phone */
  stampsArrived: number;
  /** The name on this phone could not go online: another account has it */
  nameTaken?: string;
}

export async function syncOnce(remote: Remote, local: Local, accountId: string): Promise<SyncResult> {
  const first = syncedAccount() !== accountId;
  const outbox: Outbox = readOutbox();
  const localVisits = await local.getVisits();
  const byId = new Map(localVisits.map(v => [v.mcdonaldId, v]));

  // 1. Send the visits changed here (the first time, all of them)
  const entries = new Set(Object.keys(outbox).filter(entry => entry !== NAME_ENTRY));
  if (first) localVisits.forEach(v => entries.add(v.mcdonaldId));
  const upserts: RemoteVisit[] = [];
  const deletions: string[] = [];
  for (const id of entries) {
    const visit = byId.get(id);
    if (visit) upserts.push(toRemote(visit));
    else if (!first) deletions.push(id); // the first time, a restaurant missing here may just be one visited elsewhere
  }
  if (upserts.length > 0) await remote.upsertVisits(upserts);
  if (deletions.length > 0) await remote.deleteVisits(deletions);

  // 2. The name: the one changed here goes online; otherwise the online one (if any) comes here
  const onlineName = await remote.getName();
  const localName = await local.getName();
  let changedHere = false;
  let nameTaken: string | undefined;
  const sendName = async () => {
    try {
      await remote.setName(localName ?? null);
    } catch (error) {
      if (!(error instanceof NameTakenError)) throw error;
      // The rest of the sync goes on. The phone goes back to the online name (none, the first time), and the app
      // asks for another one
      nameTaken = error.taken;
      if (onlineName === undefined) await remote.setName(null);
      await local.setNameFromServer(onlineName ?? undefined);
      changedHere = true;
    }
  };
  if (outbox[NAME_ENTRY] !== undefined || (first && !onlineName && localName)) {
    await sendName();
  } else if (onlineName !== undefined && (onlineName ?? undefined) !== localName) {
    await local.setNameFromServer(onlineName ?? undefined);
    changedHere = true;
  } else if (onlineName === undefined) {
    await sendName();
  }

  // What was sent can leave the outbox (unless it changed again meanwhile)
  clearSent(outbox);

  // 3. Stamps, both ways
  const [localStamps, onlineStamps] = await Promise.all([local.getAchievements(), remote.listAchievements()]);
  const online = new Set(onlineStamps.map(a => a.type));
  const toSend = localStamps
    .filter(a => !online.has(a.type))
    .map(a => ({ type: a.type, unlocked_at: a.unlockedAt, value: a.value ?? null }));
  if (toSend.length > 0) await remote.addAchievements(toSend);
  const stampsArrived = await local.addMissingAchievements(
    onlineStamps.map(a => ({ type: a.type, unlockedAt: Number(a.unlocked_at), value: a.value ?? undefined })),
  );

  // 4. Take the online visits, except those changed here while this sync was running
  const onlineVisits = (await remote.listVisits()).map(fromRemote);
  const visitsChanged = await local.replaceVisits(onlineVisits, () => new Set(Object.keys(readOutbox())));

  rememberAccount(accountId);
  return { changedHere: changedHere || visitsChanged || stampsArrived > 0, stampsArrived, nameTaken };
}
