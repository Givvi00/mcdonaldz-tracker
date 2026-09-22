// Checks that a change to the structure of the local database never loses the data of a device already in use:
// upgrade from an old version keeps the records, a copy is left in localStorage first, backups are versioned.
// Run with: npm run test:data
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { openDB } from 'idb';
import {
  DB_NAME,
  MIGRATIONS,
  backupVersion,
  getPreMigrationBackup,
  getVisits,
  initDB,
  openAppDB,
  wipeAllData,
  snapshotBeforeUpgrade,
  upgradeBackup,
  type Migration,
} from '../src/services/db';

// localStorage stand-in for node
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: k => store.get(k) ?? null,
  setItem: (k, v) => void store.set(k, String(v)),
  removeItem: k => void store.delete(k),
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const reset = async () => {
  store.clear();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/** A device that has the app at version 1 with some data in it */
const seedVersion1 = async () => {
  const old = await openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore('users', { keyPath: 'id' });
      database.createObjectStore('visits', { keyPath: 'id' }).createIndex('by-mcdonaldId', 'mcdonaldId');
      database.createObjectStore('achievements', { keyPath: 'id' }).createIndex('by-userId', 'userId');
    },
  });
  await old.put('users', { id: 'u1', createdAt: 1, totalVisits: 2, totalPoints: 2, name: 'Gabri' });
  await old.put('visits', { id: 'v1', mcdonaldId: 'a', visitedAt: 100 });
  await old.put('visits', { id: 'v2', mcdonaldId: 'b', visitedAt: 200 });
  await old.put('achievements', { id: 'a1', userId: 'u1', type: 'REGION:Abruzzo', unlockedAt: 300 });
  old.close();
};

// A future step: adds a field to every visit and a new store
const v2: Migration = async (database, tx) => {
  database.createObjectStore('extra' as never, { keyPath: 'id' } as never);
  let cursor = await tx.objectStore('visits').openCursor();
  while (cursor) {
    await cursor.update({ ...cursor.value, verified: false } as typeof cursor.value);
    cursor = await cursor.continue();
  }
};

await reset();
await test('a new install creates every store and leaves no copy', async () => {
  const database = await openAppDB();
  assert.deepEqual([...database.objectStoreNames].sort(), ['achievements', 'users', 'visits']);
  assert.equal(getPreMigrationBackup(), null);
  database.close();
});

await reset();
await test('upgrading keeps every record and rewrites them with the new field', async () => {
  await seedVersion1();
  const database = await openAppDB(2, { ...MIGRATIONS, 2: v2 });
  assert.equal(database.version, 2);
  const visits = await database.getAll('visits');
  assert.equal(visits.length, 2);
  assert.ok(visits.every(v => (v as unknown as { verified: boolean }).verified === false));
  assert.equal((await database.get('users', 'u1'))?.name, 'Gabri');
  assert.equal((await database.getAll('achievements')).length, 1);
  assert.ok(database.objectStoreNames.contains('extra' as never));
  database.close();
});

await reset();
await test('a copy of the data is left before the upgrade', async () => {
  await seedVersion1();
  await openAppDB(2, { ...MIGRATIONS, 2: v2 }).then(d => d.close());
  const copy = getPreMigrationBackup();
  assert.ok(copy);
  const data = JSON.parse(copy.json);
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.visits.length, 2);
  assert.equal(data.users[0].name, 'Gabri');
});

await reset();
await test('a failing step aborts the upgrade and the old data stays', async () => {
  await seedVersion1();
  const broken: Migration = () => {
    throw new Error('boom');
  };
  const originalError = console.error;
  console.error = () => {};
  await assert.rejects(openAppDB(2, { ...MIGRATIONS, 2: broken }));
  console.error = originalError;
  const still = await openDB(DB_NAME);
  assert.equal(still.version, 1);
  assert.equal((await still.getAll('visits')).length, 2);
  still.close();
});

await reset();
await test('opening at the same version makes no copy and no change', async () => {
  await seedVersion1();
  assert.equal(await snapshotBeforeUpgrade(1), false);
  assert.equal(getPreMigrationBackup(), null);
});

await test('with no database the check does not create an empty one', async () => {
  await reset();
  assert.equal(await snapshotBeforeUpgrade(2), false);
  const database = await openAppDB();
  assert.equal(database.objectStoreNames.length, 3);
  database.close();
});

await test('backups: old files count as version 1, newer ones are refused', () => {
  assert.equal(backupVersion({}), 1);
  assert.equal(backupVersion({ schemaVersion: 3 }), 3);
  assert.throws(() => upgradeBackup({ schemaVersion: 99 }), /più recente/);
  const data = { visits: [{ id: 'v', mcdonaldId: 'a', visitedAt: 1 }] };
  assert.deepEqual(upgradeBackup(data), data);
  const steps = { 2: (d: typeof data) => ({ ...d, visits: d.visits.map(v => ({ ...v, verified: false })) }) };
  const up = upgradeBackup(data, steps as never, 2) as unknown as { visits: { verified: boolean }[] };
  assert.equal(up.visits[0].verified, false);
});

await reset();
await test('many callers at startup share one connection, and "Cancella tutto" really deletes', async () => {
  await seedVersion1();
  // everything in the app asks for the database at the same moment when it starts
  const connections = await Promise.all([initDB(), initDB(), initDB(), getVisits()]);
  assert.equal(connections[0], connections[1]);
  assert.equal(connections[1], connections[2]);
  assert.equal((connections[3] as unknown[]).length, 2);
  await wipeAllData();
  const names = (await indexedDB.databases()).map(d => d.name);
  assert.ok(!names.includes(DB_NAME), 'the database is still there');
  // and the app can start again from scratch afterwards
  assert.equal((await getVisits()).length, 0);
});

console.log(`\n${passed} migration checks passed`);
