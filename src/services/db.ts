import { openDB, DBSchema, IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import type { Visit, User, Achievement, VisitRating } from '@shared/types';

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
//   3. if backups change shape, add BACKUP_MIGRATIONS[<new version>] to bring an older backup up to date.
// Before any upgrade the data is copied to localStorage (see snapshotBeforeUpgrade), as a last resort.
export const DB_NAME = 'mcdonaldz-tracker';
export const DB_VERSION = 1;
const SAFETY_KEY = 'mcdonaldz-pre-migration-backup';

type Upgrading = IDBPTransaction<AppDB, StoreNames<AppDB>[], 'versionchange'>;
export type Migration = (db: IDBPDatabase<AppDB>, tx: Upgrading) => void | Promise<void>;
export type BackupData = { schemaVersion?: number; users?: User[]; visits?: Visit[]; achievements?: Achievement[] };

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

/** Steps that bring the content of an older backup file up to date, one version at a time */
export const BACKUP_MIGRATIONS: Record<number, (data: BackupData) => BackupData> = {};

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

async function readAll(database: IDBPDatabase<AppDB>): Promise<BackupData> {
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

/** The copy made before the last upgrade, if any (same format as a backup file) */
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

export async function initDB(): Promise<IDBPDatabase<AppDB>> {
  if (db) return db;
  db = await openAppDB();
  return db;
}

export async function getOrCreateUser(): Promise<User> {
  const database = await initDB();
  const allUsers = await database.getAll('users');

  if (allUsers.length > 0) {
    return allUsers[0];
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
  await database.put('users', updated);
  return updated;
}

export async function addVisit(mcdonaldId: string, userId: string): Promise<Visit> {
  const database = await initDB();
  const visit: Visit = {
    id: 'visit_' + Date.now(),
    mcdonaldId,
    visitedAt: Date.now(),
  };

  await database.add('visits', visit);

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
    await database.delete('visits', index.id);

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
  await database.put('visits', { ...visit, visitedAt, dateEdited: true });
}

/** Sets (or replaces) your vote for a visited restaurant */
export async function setVisitRating(mcdonaldId: string, rating: VisitRating): Promise<void> {
  const database = await initDB();
  const visit = await database.getFromIndex('visits', 'by-mcdonaldId', mcdonaldId);
  if (!visit) return;
  await database.put('visits', { ...visit, rating });
}

export async function getVisits(): Promise<Visit[]> {
  const database = await initDB();
  return database.getAll('visits');
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

export async function exportData(): Promise<string> {
  const database = await initDB();
  return JSON.stringify({ schemaVersion: DB_VERSION, ...(await readAll(database)) }, null, 2);
}

/** Version of a backup file: the files made before the versions existed are version 1 */
export function backupVersion(data: BackupData): number {
  return typeof data.schemaVersion === 'number' ? data.schemaVersion : 1;
}

/** Throws a readable error for a backup made by a newer version of the app; otherwise brings it up to date */
export function upgradeBackup(data: BackupData, steps: Record<number, (d: BackupData) => BackupData> = BACKUP_MIGRATIONS, to = DB_VERSION): BackupData {
  const from = backupVersion(data);
  if (from > to) throw new Error("Il backup è stato fatto con una versione più recente dell'app: aggiorna l'app e riprova");
  let current = data;
  for (let version = from + 1; version <= to; version++) {
    const step = steps[version];
    if (step) current = step(current);
  }
  return current;
}

export async function importData(jsonData: string): Promise<void> {
  const database = await initDB();
  const data = upgradeBackup(JSON.parse(jsonData));

  for (const user of data.users || []) {
    await database.put('users', user);
  }
  for (const visit of data.visits || []) {
    await database.put('visits', visit);
  }
  for (const achievement of data.achievements || []) {
    await database.put('achievements', achievement);
  }
}
