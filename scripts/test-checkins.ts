// Checks the visit counter (src/utils/checkins.ts and db.addCheckin): a return counts at most once every 4 hours,
// it verifies a visit marked by hand, and it reaches the other phone.
// Run with: npm run test:data
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import type { Visit } from '../shared/types';
import { CHECKIN_GAP_MS, canCheckIn, visitCount, withCheckin } from '../src/utils/checkins';
import { fromRemote, toRemote } from '../src/services/sync';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> }).localStorage = {
  getItem: k => store.get(k) ?? null,
  setItem: (k, v) => void store.set(k, String(v)),
  removeItem: k => void store.delete(k),
};
const { addCheckin, addVisit, getOrCreateUser, getVisits } = await import('../src/services/db');

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const H = 60 * 60 * 1000;
const base: Visit = { id: 'v', mcdonaldId: 'mc1', visitedAt: 1_000_000 };

await test('the marked visit counts 1; a return 4 hours later counts, one sooner does not', () => {
  assert.equal(visitCount(base), 1);
  assert.ok(!canCheckIn(base, base.visitedAt + 3 * H));
  assert.ok(canCheckIn(base, base.visitedAt + CHECKIN_GAP_MS));
  const once = withCheckin(base, base.visitedAt + 5 * H);
  assert.equal(visitCount(once), 2);
  assert.ok(!canCheckIn(once, base.visitedAt + 8 * H), 'lunch and then again 3 hours later: no');
  assert.ok(canCheckIn(once, base.visitedAt + 9 * H), 'dinner: yes');
});

await test('a return also verifies a visit marked by hand, keeping an earlier verification as it was', () => {
  const at = base.visitedAt + 5 * H;
  assert.deepEqual([withCheckin(base, at).verified, withCheckin(base, at).verifiedAt], [true, at]);
  const verified = withCheckin({ ...base, verified: true, verifiedAt: 7 }, at);
  assert.equal(verified.verifiedAt, 7);
});

await test('on the phone: counted once, a second try too soon changes nothing', async () => {
  const user = await getOrCreateUser();
  await addVisit('mc9', user.id);
  const marked = (await getVisits()).find(v => v.mcdonaldId === 'mc9')!;
  await addCheckin('mc9', marked.visitedAt + 1 * H);
  assert.equal(visitCount((await getVisits()).find(v => v.mcdonaldId === 'mc9')!), 1, 'too soon after marking');
  await addCheckin('mc9', marked.visitedAt + 5 * H);
  await addCheckin('mc9', marked.visitedAt + 6 * H);
  const after = (await getVisits()).find(v => v.mcdonaldId === 'mc9')!;
  assert.equal(visitCount(after), 2);
  assert.ok(after.verified);
});

await test('the returns travel to the other phone, and a visit without returns sends none', () => {
  const back = fromRemote(toRemote(withCheckin(base, base.visitedAt + 5 * H)));
  assert.deepEqual(back.checkins, [base.visitedAt + 5 * H]);
  assert.equal(toRemote(base).checkins, null);
  assert.equal(fromRemote(toRemote(base)).checkins, undefined);
});

console.log(`\n${passed} visit counter checks passed`);
