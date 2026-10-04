// Checks what the friends see of you (src/services/friends.ts): only numbers and milestones, the right ones.
// Run with: npm run test:data
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import type { McDonald, Visit } from '../shared/types';
import { boardNews, buildPublicStats, doneRegions, friendRegions, placeOf, snapshotOf, type Friend } from '../src/services/friends';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const mc = (id: string, region: string, opened = true): McDonald => ({ id, name: `McDonald's ${id}`, lat: 42, lon: 12, region, city: 'Città', address: 'Via', opened });
const list = [mc('a1', 'Molise'), mc('a2', 'Molise'), mc('b1', 'Lazio'), mc('b2', 'Lazio'), mc('b3', 'Lazio'), mc('c1', 'Umbria')];
const visit = (id: string, at: number, verified = false): Visit => ({ id: `v-${id}`, mcdonaldId: id, visitedAt: at, verified, rating: { staff: 3, speed: 3 } } as Visit);

test('counts, level, last visit and stamps; regions only where something happened', () => {
  const visits = [visit('a1', 10, true), visit('a2', 30, true), visit('b1', 20), visit('zz', 99)];
  const stats = buildPublicStats(list, visits, [
    { id: 1, userId: 'u', type: 'FIRST_STAMP', unlockedAt: 1 },
    { id: 2, userId: 'u', type: 'REGION:Molise', unlockedAt: 2 },
  ] as never);
  assert.equal(stats.visited, 3, 'an unknown restaurant does not count');
  assert.equal(stats.verified, 2);
  assert.equal(stats.level, 1);
  assert.deepEqual(stats.stamps, ['FIRST_STAMP'], 'region records are not stamps');
  assert.deepEqual(Object.keys(stats.regions).sort(), ['Lazio', 'Molise']);
  assert.deepEqual(stats.regions.Molise, { v: 2, t: 2, ver: 2, vf: 2, was: true });
  assert.equal(stats.last_visit?.name, "McDonald's a2");
  assert.ok(!JSON.stringify(stats).includes('rating') && !JSON.stringify(stats).includes('lat'), 'no votes, no positions');
});

test('gold and diamond regions of a friend', () => {
  const friend = { regions: { Molise: { v: 2, t: 2, ver: 2, vf: 2 }, Lazio: { v: 3, t: 3, ver: 1, vf: 3 }, Umbria: { v: 0, t: 1, ver: 0, vf: 1, was: true } } };
  assert.deepEqual(doneRegions(friend), { gold: 1, diamond: 1 });
  const { tiers, summaries } = friendRegions(friend, list);
  assert.equal(tiers.Molise, 'diamond');
  assert.equal(tiers.Lazio, 'gold');
  assert.equal(tiers.Umbria, 'silver', 'completed once, then a new one opened');
  assert.equal(summaries.length, 3);
});

test('a friend with nothing yet: every region empty', () => {
  const { tiers } = friendRegions({ regions: {} }, list);
  assert.deepEqual(Object.values(tiers), ['empty', 'empty', 'empty']);
});

const person = (userId: string, visited: number, verified = 0): Friend =>
  ({ userId, name: userId, visited, visits_total: visited, verified, level: 1, regions: {}, stamps: [], last_visit: null, updatedAt: '' });

test('leaderboard news: nothing the first time, then who joined, who passed you, who you passed', () => {
  const before = [person('me', 10), person('marco', 12), person('giulia', 8)];
  assert.deepEqual(boardNews(null, before, 'me'), []);
  const seen = snapshotOf(before, 'me');
  assert.deepEqual(boardNews(seen, before, 'me'), [], 'nothing changed');
  const after = [person('me', 13), person('marco', 12), person('giulia', 14), person('luca', 1)];
  const news = boardNews(seen, after, 'me');
  assert.deepEqual(news.map(n => `${n.kind}:${n.userId}`).sort(), ['joined:luca', 'passedYou:giulia', 'youPassed:marco']);
  assert.equal(placeOf(after, 'me'), 2);
});

test('same visits: the verified ones decide; a snapshot of another account says nothing', () => {
  const seen = snapshotOf([person('me', 5, 1), person('marco', 5, 2)], 'me');
  assert.deepEqual(boardNews(seen, [person('me', 5, 3), person('marco', 5, 2)], 'me').map(n => n.kind), ['youPassed']);
  assert.deepEqual(boardNews(seen, [person('other', 50), person('marco', 5, 2)], 'other'), []);
});

console.log(`\n${passed} friends checks passed`);
