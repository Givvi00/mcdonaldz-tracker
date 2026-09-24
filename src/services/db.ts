import { openDB, DBSchema, IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import type { Visit, User, Achievement, VisitRating } from '@shared/types';
import { NAME_ENTRY, changing } from './syncOutbox';

interface AppDB extends DBSchema {
  users: {
    key: string;
    value: User;
  };
  visits: {
    key: string;
    value: Visit;
    indexes: { 'by-mcdonaldId': string };
  };
  achievements: {
    key: string;
    value: Achievement;
    indexes: { 'by-userId': string };
  };
}

let db: IDBPDatabase<AppDB> | null = null;

// ---- Versions and migrations ------------------------------------------------------------------------------------
// The data lives only in this browser, so a change to the structure of the database must never lose it. To change it:
//   1. raise DB_VERSION by one;
//   2. add MIGRATIONS[<new version>]: it receives the database of the previous version and changes it (create a store,
//      add an index, rewrite the records with the new field...). Never edit a step that has already been published;
// Before any upgrade the data is copied to localStorage (see snapshotBeforeUpgrade), as a last resort.
export const DB_NAME = 'mcdonaldz-tracker';
export const DB_VERSION = 1;
const SAFETY_KEY = 'mcdonaldz-pre-migration-backup';

type Upgrading = IDBPTransaction<AppDB, StoreNames<AppDB>[], 'versionchange'>;
export type Migration = (db: IDBPDatabase<AppDB>, tx: Upgrading) => void | Promise<void>;
type SavedData = { schemaVersion?: number; users?: User[]; visits?: Visit[]; achievements?: Achievement[] };

export const MIGRATIONS: Record<number, Migration> = {
  1: db => {
    if (!db.objectStoreNames.contains('users')) {
      db.createObjectStore('users', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('visits')) {
      const visitStore = db.createObjectStore('visits', { keyPath: 'id' });
      visitStore.createIndex('by-mcdonaldId', 'mcdonaldId');
    }
    if (!db.objectStoreNames.contains('achievements')) {
      const achStore = db.createObjectStore('achievements', { keyPath: 'id' });
      achStore.createIndex('by-userId', 'userId');
    }
  },
};

/** Runs every step between the version found on the device and the current one (a new install runs them all) */
export async function runMigrations(
  database: IDBPDatabase<AppDB>,
  tx: Upgrading,
  from: number,
  to: number,
  steps: Record<number, Migration>,
): Promise<void> {
  for (let version = from + 1; version <= to; version++) {
    const step = steps[version];
    if (!step) throw new Error(`Manca la migrazione del database alla versione ${version}`);
    await step(database, tx);
  }
}

async function readAll(database: IDBPDatabase<AppDB>): Promise<SavedData> {
  return {
    users: await database.getAll('users'),
    visits: await database.getAll('visits'),
    achievements: await database.getAll('achievements'),
  };
}

/**
 * If the database on this device is older than the code, copies everything to localStorage before the upgrade. It never
 * throws: the copy is a safety net, it must not stop the app from opening. Returns true when a copy was made.
 */
export async function snapshotBeforeUpgrade(version = DB_VERSION): Promise<boolean> {
  try {
    if (typeof localStorage === 'undefined') return false;
    // Opening without a version on a device with no database would create an empty one: abort in that case
    let existing: IDBPDatabase<AppDB>;
    try {
      existing = await openDB<AppDB>(DB_NAME, undefined, {
        upgrade: (_db, _old, _new, tx) => {
          tx.done.catch(() => {}); // the abort is expected
          tx.abort();
        },
      });
    } catch {
      return false;
    }
    try {
      if (existing.version >= version) return false;
      const data = { schemaVersion: existing.version, ...(await readAll(existing)) };
      localStorage.setItem(SAFETY_KEY, JSON.stringify({ savedAt: Date.now(), data }));
      return true;
    } finally {
      existing.close();
    }
  } catch {
    return false;
  }
}

/** The copy made before the last upgrade, if any (kept as a last resort, read by hand if ever needed) */
export function getPreMigrationBackup(): { savedAt: number; json: string } | null {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(SAFETY_KEY);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    return { savedAt, json: JSON.stringify(data, null, 2) };
  } catch {
    return null;
  }
}

export async function openAppDB(version = DB_VERSION, steps: Record<number, Migration> = MIGRATIONS): Promise<IDBPDatabase<AppDB>> {
  await snapshotBeforeUpgrade(version);
  return openDB<AppDB>(DB_NAME, version, {
    upgrade(database, oldVersion, newVersion, tx) {
      // The steps run inside the upgrade transaction: they may only touch the database, never wait on anything else
      void runMigrations(database, tx as Upgrading, oldVersion, newVersion ?? version, steps).catch(error => {
        console.error('Migrazione fallita', error);
        tx.done.catch(() => {});
        tx.abort();
      });
    },
  });
}

/**
 * Deletes every visit, stamp and setting on this device. The open connection is closed first: while it is open the
 * browser holds the deletion back, and a reload in the meantime would leave the data where it was.
 */
export async function wipeAllData(): Promise<void> {
  await closeDB();
  try {
    localStorage.clear();
  } catch {
    // storage unavailable: nothing to clear
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    // Another tab of the app still has it open: it closes its connection when told (see initDB), give it a moment
    req.onblocked = () => setTimeout(resolve, 1500);
  });
}

// One connection for the whole app. Everything asks for the database at startup at the same moment: keeping the
// promise (not the connection) makes them share one, instead of opening several and forgetting all but the last,
// which would stay open for ever and hold back a deletion or a future upgrade of the structure.
let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function initDB(): Promise<IDBPDatabase<AppDB>> {
  dbPromise ??= openAppDB().then(
    connection => {
      db = connection;
      // Another tab (a newer version of the app, or "Cancella tutto") needs the database: step aside
      connection.addEventListener('versionchange', () => {
        connection.close();
        if (db === connection) {
          db = null;
          dbPromise = null;
        }
      });
      return connection;
    },
    error => {
      dbPromise = null;
      throw error;
    },
  );
  return dbPromise;
}

async function closeDB(): Promise<void> {
  const pending = dbPromise;
  dbPromise = null;
  db = null;
  if (pending) (await pending.catch(() => null))?.close();
}

// Two calls at the same moment (the app starting twice in development, or any future overlap) must not both find no
// user and create one each: the stamps are stored per user, and those of the second one would never be seen again.
let userPromise: Promise<User> | null = null;

export function getOrCreateUser(): Promise<User> {
  userPromise ??= loadOrCreateUser().finally(() => {
    userPromise = null;
  });
  return userPromise;
}

async function loadOrCreateUser(): Promise<User> {
  const database = await initDB();
  const allUsers = await database.getAll('users');

  if (allUsers.length > 0) {
    // The oldest one, always the same (ids grow with time)
    return allUsers.sort((a, b) => a.createdAt - b.createdAt)[0];
  }

  const newUser: User = {
    id: 'user_' + Date.now(),
    createdAt: Date.now(),
    totalVisits: 0,
    totalPoints: 0,
  };

  await database.add('users', newUser);
  return newUser;
}

export async function setUserName(userId: string, name: string): Promise<User | null> {
  const database = await initDB();
  const user = await database.get('users', userId);
  if (!user) return null;
  const updated: User = { ...user, name: name.trim().slice(0, 16) || undefined };
  await changing(NAME_ENTRY, () => database.put('users', updated));
  return updated;
}

/** The name as it arrived from the online copy (not a change made here: nothing to send back) */
export async function setUserNameFromServer(userId: string, name: string | undefined): Promise<void> {
  const database = await initDB();
  const user = await database.get('users', userId);
  if (!user || user.name === name) return;
  await database.put('users', { ...user, name });
}

export async function addVisit(mcdonaldId: string, userId: string): Promise<Visit> {
  const database = await initDB();
  const visit: Visit = {
    id: `visit_${Date.now()}_${mcdonaldId}`,
    mcdonaldId,
    visitedAt: Date.now(),
  };

  await changing(mcdonaldId, () => database.add('visits', visit));

  // Update user
  const user = await database.get('users', userId);
  if (user) {
    user.totalVisits += 1;
    user.totalPoints += 1;
    await database.put('users', user);
  }

  return visit;
}

export async function removeVisit(mcdonaldId: string, userId: string): Promise<void> {
  const database = await initDB();
  const index = await database.getFromIndex('visits', 'by-mcdonaldId', mcdonaldId);

  if (index) {
    await changing(mcdonaldId, () => database.delete('visits', index.id));

    // Update user
    const user = await database.get('users', userId);
    if (user && user.totalVisits > 0) {
      user.totalVisits -= 1;
      user.totalPoints -= 1;
      await database.put('users', user);
    }
  }
}

/** Changes the day of a visit (kept at noon: once edited, the time of day means nothing) */
export async function setVisitDate(mcdonaldId: string, visitedAt: number): Promise<void> {
  const database = await initDB();
  const visit = await database.getFromIndex('visits', 'by-mcdonaldId', mcdonaldId);
  if (!visit) return;
  await changing(mcdonaldId, () => database.put('visits', { ...visit, visitedAt, dateEdited: true }));
}

/** Marks a visit as confirmed by the GPS at `verifiedAt` (the date of the visit itself does not change) */
export async function setVisitVerified(mcdonaldId: string, verifiedAt: number): Promise<void> {
  const database = await initDB();
  const visit = await database.getFromIndex('visits', 'by-mcdonaldId', mcdonaldId);
  if (!visit || visit.verified) return;
  await changing(mcdonaldId, () => database.put('visits', { ...visit, verified: true, verifiedAt }));
}

/** Sets (or replaces) your vote for a visited restaurant */
export async function setVisitRating(mcdonaldId: string, rating: VisitRating): Promise<void> {
  const database = await initDB();
  const visit = await database.getFromIndex('visits', 'by-mcdonaldId', mcdonaldId);
  if (!visit) return;
  await changing(mcdonaldId, () => database.put('visits', { ...visit, rating }));
}

export async function getVisits(): Promise<Visit[]> {
  const database = await initDB();
  return database.getAll('visits');
}

/**
 * Brings the visits on this phone in line with the online copy, in one go: every restaurant takes the online version
 * (or disappears, if it is not online), except those changed here and not sent yet (`keepLocal`, read at the last
 * moment inside the transaction). Returns true if anything changed.
 */
export async function replaceVisits(online: Visit[], keepLocal: () => Set<string>): Promise<boolean> {
  const database = await initDB();
  const tx = database.transaction('visits', 'readwrite');
  const current = await tx.store.getAll();
  const keep = keepLocal();
  const localById = new Map(current.map(v => [v.mcdonaldId, v]));
  const next: Visit[] = current.filter(v => keep.has(v.mcdonaldId));
  for (const visit of online) {
    if (keep.has(visit.mcdonaldId)) continue;
    // The same record id as before, so nothing else about it looks new
    next.push({ ...visit, id: localById.get(visit.mcdonaldId)?.id ?? visit.id });
  }
  const key = (list: Visit[]) => JSON.stringify([...list].sort((a, b) => a.mcdonaldId.localeCompare(b.mcdonaldId)));
  if (key(next) === key(current)) {
    await tx.done;
    return false;
  }
  await tx.store.clear();
  for (const visit of next) await tx.store.put(visit);
  await tx.done;
  return true;
}

export async function getVisitsByMcdonaldId(mcdonaldId: string): Promise<Visit[]> {
  const database = await initDB();
  return database.getAllFromIndex('visits', 'by-mcdonaldId', mcdonaldId);
}

export async function addAchievement(achievement: Achievement): Promise<void> {
  const database = await initDB();
  await database.add('achievements', achievement);
}

export async function getAchievements(userId: string): Promise<Achievement[]> {
  const database = await initDB();
  return database.getAllFromIndex('achievements', 'by-userId', userId);
}

/** Adds the stamps earned on another phone that this one does not have yet. Returns how many were added. */
export async function addMissingAchievements(
  userId: string,
  earned: Array<Pick<Achievement, 'type' | 'unlockedAt' | 'value'>>,
): Promise<number> {
  const database = await initDB();
  const known = new Set((await database.getAllFromIndex('achievements', 'by-userId', userId)).map(a => a.type));
  let added = 0;
  for (const a of earned) {
    if (known.has(a.type)) continue;
    await database.put('achievements', { id: `ach_online_${a.type}`, userId, type: a.type, unlockedAt: a.unlockedAt, value: a.value });
    known.add(a.type);
    added += 1;
  }
  return added;
}

/** For the tests: forget the open connection, as a phone that starts again would */
export const closeDBForTests = closeDB;
