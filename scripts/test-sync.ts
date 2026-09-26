// Checks the sync between a phone and the online copy of its account (src/services/sync.ts), with the real local
// database and an online copy kept in memory: nothing done on a phone is ever lost, and what another phone did arrives.
// Run with: npm run test:data
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {
  DB_NAME,
  addMissingAchievements,
  addVisit,
  closeDBForTests,
  getAchievements,
  getOrCreateUser,
  getVisits,
  removeVisit,
  replaceVisits,
  setUserName,
  setUserNameFromServer,
  setVisitDiary,
  setVisitRating,
  setVisitVerified,
} from '../src/services/db';
import { NameTakenError, syncOnce, type Local, type Remote, type RemoteAchievement, type RemoteVisit } from '../src/services/sync';
import { readOutbox } from '../src/services/syncOutbox';

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
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

/** The online copy of one account, in memory */
class FakeRemote implements Remote {
  visits = new Map<string, RemoteVisit>();
  stamps = new Map<string, RemoteAchievement>();
  name: string | null | undefined = undefined;
  failNext = false;
  /** Names of other accounts */
  others = new Set<string>();
  /** Runs in the middle of a sync, to simulate a tap on the phone at that moment */
  duringList: (() => Promise<void>) | null = null;

  private maybeFail() {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('network down');
    }
  }
  async listVisits() {
    if (this.duringList) {
      const hook = this.duringList;
      this.duringList = null;
      await hook();
    }
    return [...this.visits.values()].map(v => ({ ...v }));
  }
  async upsertVisits(rows: RemoteVisit[]) {
    this.maybeFail();
    rows.forEach(r => this.visits.set(r.mcdonald_id, { ...r }));
  }
  async deleteVisits(ids: string[]) {
    this.maybeFail();
    ids.forEach(id => this.visits.delete(id));
  }
  async listAchievements() {
    return [...this.stamps.values()];
  }
  async addAchievements(rows: RemoteAchievement[]) {
    rows.forEach(r => this.stamps.has(r.type) || this.stamps.set(r.type, r));
  }
  async getName() {
    return this.name;
  }
  async setName(name: string | null) {
    if (name && this.others.has(name.toLowerCase())) throw new NameTakenError(name);
    this.name = name;
  }
}

async function local(): Promise<Local> {
  const user = await getOrCreateUser();
  return {
    getVisits,
    replaceVisits,
    getAchievements: () => getAchievements(user.id),
    addMissingAchievements: earned => addMissingAchievements(user.id, earned),
    getName: async () => (await getOrCreateUser()).name,
    setNameFromServer: name => setUserNameFromServer(user.id, name),
  };
}

/** A new phone: empty database and storage */
async function newPhone() {
  await closeDBForTests();
  store.clear();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

const ACCOUNT = 'account-1';
const ids = async () => (await getVisits()).map(v => v.mcdonaldId).sort();

await newPhone();
const online = new FakeRemote();

await test('first sign-in sends every visit, the name and the stamps already on the phone', async () => {
  const user = await getOrCreateUser();
  await addVisit('a', user.id);
  await addVisit('b', user.id);
  await setVisitVerified('b', 1234);
  await setVisitRating('a', { cleanliness: 5, staff: 4, outdoorSpace: 3, speed: 2 });
  await setUserName(user.id, 'Gabri');
  await setVisitDiary('b', { ate: ['bigmac', 'fries'], notes: 'Con Marco dopo la partita' });
  await addMissingAchievements(user.id, [{ type: 'FIRST_STAMP', unlockedAt: 99 }]);
  const result = await syncOnce(online, await local(), ACCOUNT);
  assert.deepEqual([...online.visits.keys()].sort(), ['a', 'b']);
  assert.equal(online.visits.get('b')?.verified, true);
  assert.equal(online.visits.get('b')?.verified_at, 1234);
  assert.equal(online.visits.get('a')?.rating?.cleanliness, 5);
  assert.deepEqual(online.visits.get('b')?.ate, ['bigmac', 'fries']);
  assert.equal(online.visits.get('b')?.notes, 'Con Marco dopo la partita');
  assert.equal(online.visits.get('a')?.notes, null, 'no diary: nothing sent');
  assert.equal(online.name, 'Gabri');
  assert.ok(online.stamps.has('FIRST_STAMP'));
  assert.deepEqual(readOutbox(), {}, 'everything was sent');
  assert.equal(result.changedHere, false, 'nothing new came back');
});

await test('a second phone receives visits, votes, verification, name and stamps, identical', async () => {
  const before = (await getVisits()).map(v => ({ ...v, id: '' })).sort((x, y) => x.mcdonaldId.localeCompare(y.mcdonaldId));
  await newPhone();
  const result = await syncOnce(online, await local(), ACCOUNT);
  assert.equal(result.changedHere, true);
  const after = (await getVisits()).map(v => ({ ...v, id: '' })).sort((x, y) => x.mcdonaldId.localeCompare(y.mcdonaldId));
  assert.deepEqual(after, before);
  assert.equal((await getOrCreateUser()).name, 'Gabri');
  assert.deepEqual((await getAchievements((await getOrCreateUser()).id)).map(a => a.type), ['FIRST_STAMP']);
});

await test('removing a visit here removes it online; one removed elsewhere disappears here', async () => {
  const user = await getOrCreateUser();
  await removeVisit('a', user.id);
  await syncOnce(online, await local(), ACCOUNT);
  assert.ok(!online.visits.has('a'));
  online.visits.delete('b'); // another phone removed it
  await syncOnce(online, await local(), ACCOUNT);
  assert.deepEqual(await ids(), []);
});

await test('a visit made elsewhere arrives, a visit made here goes out, in the same sync', async () => {
  const user = await getOrCreateUser();
  online.visits.set('c', { mcdonald_id: 'c', visited_at: 5, date_edited: false, verified: false, verified_at: null, rating: null, notes: null, ate: null });
  await addVisit('d', user.id);
  await syncOnce(online, await local(), ACCOUNT);
  assert.deepEqual(await ids(), ['c', 'd']);
  assert.deepEqual([...online.visits.keys()].sort(), ['c', 'd']);
});

await test('with no connection nothing is lost: the change stays marked and goes out next time', async () => {
  const user = await getOrCreateUser();
  await addVisit('e', user.id);
  online.failNext = true;
  await assert.rejects(syncOnce(online, await local(), ACCOUNT));
  assert.ok('e' in readOutbox());
  assert.deepEqual(await ids(), ['c', 'd', 'e'], 'still on the phone');
  await syncOnce(online, await local(), ACCOUNT);
  assert.ok(online.visits.has('e'));
  assert.deepEqual(readOutbox(), {});
});

await test('a visit marked while a sync is running is neither overwritten nor forgotten', async () => {
  const user = await getOrCreateUser();
  online.duringList = async () => {
    await addVisit('f', user.id);
  };
  await syncOnce(online, await local(), ACCOUNT);
  assert.ok((await ids()).includes('f'), 'kept on the phone');
  assert.ok('f' in readOutbox(), 'still to send');
  await syncOnce(online, await local(), ACCOUNT);
  assert.ok(online.visits.has('f'));
});

await test('a phone with its own visits signing in joins them with the online ones', async () => {
  await newPhone();
  const user = await getOrCreateUser();
  await addVisit('c', user.id); // also online, with an older date: the phone's version wins
  await addVisit('z', user.id);
  await setUserName(user.id, 'Altro');
  await syncOnce(online, await local(), ACCOUNT);
  assert.deepEqual(await ids(), ['c', 'd', 'e', 'f', 'z']);
  assert.deepEqual([...online.visits.keys()].sort(), ['c', 'd', 'e', 'f', 'z']);
  assert.notEqual(online.visits.get('c')?.visited_at, 5);
  assert.equal(online.name, 'Altro', 'a name changed here goes online');
});

await test('a new name from another phone arrives', async () => {
  online.name = 'Gabriele';
  const result = await syncOnce(online, await local(), ACCOUNT);
  assert.equal(result.changedHere, true);
  assert.equal((await getOrCreateUser()).name, 'Gabriele');
  assert.deepEqual(readOutbox(), {}, 'receiving it is not a change to send back');
});

await test('clearing the diary removes it here and online', async () => {
  const user = await getOrCreateUser();
  await addVisit('h', user.id);
  await setVisitDiary('h', { ate: ['mcflurry'], notes: 'buono' });
  await syncOnce(online, await local(), ACCOUNT);
  assert.deepEqual(online.visits.get('h')?.ate, ['mcflurry']);
  await setVisitDiary('h', { ate: [], notes: '   ' });
  await syncOnce(online, await local(), ACCOUNT);
  assert.equal(online.visits.get('h')?.ate, null);
  assert.equal(online.visits.get('h')?.notes, null);
  const h = (await getVisits()).find(v => v.mcdonaldId === 'h');
  assert.ok(h && !('ate' in h) && !('notes' in h), 'no empty fields left on the phone');
});

await test('a sync with nothing new changes nothing', async () => {
  const result = await syncOnce(online, await local(), ACCOUNT);
  assert.equal(result.changedHere, false);
});

await test('a name another account already has is refused, the rest of the sync goes through', async () => {
  const user = await getOrCreateUser();
  online.others.add('mario');
  await setUserName(user.id, 'Mario');
  await addVisit('g', user.id);
  const result = await syncOnce(online, await local(), ACCOUNT);
  assert.equal(result.nameTaken, 'Mario');
  assert.equal(online.name, 'Gabriele', 'the online name did not change');
  assert.equal((await getOrCreateUser()).name, 'Gabriele', 'the phone went back to it');
  assert.ok(online.visits.has('g'), 'the visits went out anyway');
  assert.deepEqual(readOutbox(), {});
});

await test('removed and marked again while offline: it goes out as a visit, not as a removal', async () => {
  const user = await getOrCreateUser();
  await removeVisit('c', user.id);
  await addVisit('c', user.id);
  await syncOnce(online, await local(), ACCOUNT);
  assert.ok(online.visits.has('c'));
});

await test('a verification and a vote made on another phone arrive on a visit not touched here', async () => {
  online.visits.set('d', { ...online.visits.get('d')!, verified: true, verified_at: 777, rating: { cleanliness: 4, staff: 4, outdoorSpace: 4, speed: 4 } });
  await syncOnce(online, await local(), ACCOUNT);
  const d = (await getVisits()).find(v => v.mcdonaldId === 'd');
  assert.equal(d?.verified, true);
  assert.equal(d?.verifiedAt, 777);
  assert.equal(d?.rating?.speed, 4);
});

await test('stamps that arrived from another phone are not sent back, and none is ever lost', async () => {
  online.stamps.set('LUCKY_77', { type: 'LUCKY_77', unlocked_at: 5, value: null });
  const added: string[] = [];
  const original = online.addAchievements.bind(online);
  online.addAchievements = async rows => {
    added.push(...rows.map(r => r.type));
    return original(rows);
  };
  await syncOnce(online, await local(), ACCOUNT);
  await syncOnce(online, await local(), ACCOUNT);
  assert.ok(!added.includes('LUCKY_77'), 'sent back');
  const here = (await getAchievements((await getOrCreateUser()).id)).map(a => a.type);
  assert.ok(here.includes('LUCKY_77') && here.includes('FIRST_STAMP'));
  online.addAchievements = original;
});

await test('the first sign-in on a phone never deletes online what that phone does not have', async () => {
  await newPhone();
  const user = await getOrCreateUser();
  // A removal still marked from before signing in, for a restaurant visited on another phone
  await addVisit('c', user.id);
  await removeVisit('c', user.id);
  const before = [...online.visits.keys()].sort();
  await syncOnce(online, await local(), ACCOUNT);
  assert.deepEqual([...online.visits.keys()].sort(), before);
  assert.deepEqual(await ids(), before, 'the phone received everything');
});

await test('two phones change the same visit: the one that syncs last wins, nothing breaks', async () => {
  await setVisitRating('e', { cleanliness: 1, staff: 1, outdoorSpace: 1, speed: 1 });
  // Meanwhile another phone had sent a different vote
  online.visits.set('e', { ...online.visits.get('e')!, rating: { cleanliness: 5, staff: 5, outdoorSpace: 5, speed: 5 } });
  await syncOnce(online, await local(), ACCOUNT);
  assert.equal(online.visits.get('e')?.rating?.cleanliness, 1);
  assert.equal((await getVisits()).find(v => v.mcdonaldId === 'e')?.rating?.cleanliness, 1);
});

console.log(`\n${passed} sync checks passed`);
