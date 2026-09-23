// Checks the weekly comparison with OpenStreetMap: report only, and prudent (OSM is incomplete).
// Run with: npm run test:data
import assert from 'node:assert/strict';
import type { McDonald } from '../shared/types';
import { compareWithOsm, hasFindings, parseOverpass, reportMarkdown, type OsmPlace, type OsmState } from './lib/osmCompare';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

let n = 0;
const mc = (lat: number, over: Partial<McDonald> = {}): McDonald => ({
  id: `mc${String(++n).padStart(4, '0')}`,
  name: "McDonald's Test",
  lat,
  lon: 12,
  region: 'Lazio',
  city: 'Roma',
  address: 'Via Roma 1',
  opened: true,
  ...over,
});
const place = (id: number, lat: number, lon = 12): OsmPlace => ({ osmId: `node/${id}`, lat, lon, name: "McDonald's" });
const empty: OsmState = { seen: {}, unknown: {} };
// about 111 m per 0.001 degrees of latitude
const A = mc(41.9);
const B = mc(42.0);
const C = mc(42.1); // never on OSM
const list = [A, B, C];

test('lettura di Overpass: nodi e centri delle aree, senza posizione scartati', () => {
  const places = parseOverpass([
    { type: 'node', id: 1, lat: 41, lon: 12, tags: { name: "McDonald's", 'addr:city': 'Roma', 'addr:street': 'Via X', 'addr:housenumber': '3' } },
    { type: 'way', id: 2, center: { lat: 42, lon: 13 }, tags: { brand: "McDonald's" } },
    { type: 'relation', id: 3, tags: {} },
  ]);
  assert.equal(places.length, 2);
  assert.deepEqual(places[0], { osmId: 'node/1', lat: 41, lon: 12, name: "McDonald's", city: 'Roma', street: 'Via X 3' });
  assert.equal(places[1].osmId, 'way/2');
});

test('primo controllo: impara chi c’è, non segnala niente', () => {
  const { state, report } = compareWithOsm(list, [place(1, 41.9), place(2, 42.0005), place(9, 45)], empty, '2026-09-28');
  assert.equal(report.firstRun, true);
  assert.equal(report.matched, 2);
  assert.equal(hasFindings(report), false);
  assert.deepEqual(Object.keys(state.seen).sort(), [A.id, B.id]);
  assert.ok(state.unknown['node/9']);
  assert.match(reportMarkdown(report, '2026-09-28'), /Primo controllo/);
});

test('chiuso solo se OSM lo aveva e manca da due controlli; mai chi su OSM non c’è mai stato', () => {
  const run1 = compareWithOsm(list, [place(1, 41.9), place(2, 42.0)], empty, 'd1');
  // B disappears from OSM
  const run2 = compareWithOsm(list, [place(1, 41.9)], run1.state, 'd2');
  assert.equal(run2.report.possiblyClosed.length, 0, 'one miss is not enough');
  const run3 = compareWithOsm(list, [place(1, 41.9)], run2.state, 'd3');
  assert.deepEqual(
    run3.report.possiblyClosed.map(c => [c.mc.id, c.lastSeen, c.misses]),
    [[B.id, 'd1', 2]],
  );
  // C was never on OSM: never reported
  assert.ok(!run3.report.possiblyClosed.some(c => c.mc.id === C.id));
  // B comes back: the count starts again
  const run4 = compareWithOsm(list, [place(1, 41.9), place(2, 42.0)], run3.state, 'd4');
  assert.equal(run4.report.possiblyClosed.length, 0);
  assert.equal(run4.state.seen[B.id].misses, 0);
});

test('nuovo solo se lontano da tutti i nostri e presente due controlli di fila', () => {
  const run1 = compareWithOsm(list, [place(1, 41.9)], empty, 'd1');
  const run2 = compareWithOsm(list, [place(1, 41.9), place(7, 44)], run1.state, 'd2');
  assert.equal(run2.report.possiblyNew.length, 0, 'seen once');
  const run3 = compareWithOsm(list, [place(1, 41.9), place(7, 44)], run2.state, 'd3');
  assert.deepEqual(run3.report.possiblyNew.map(x => [x.place.osmId, x.firstSeen]), [['node/7', 'd2']]);
  // gone in between: the streak starts again
  const run4 = compareWithOsm(list, [place(1, 41.9)], run3.state, 'd4');
  const run5 = compareWithOsm(list, [place(1, 41.9), place(7, 44)], run4.state, 'd5');
  assert.equal(run5.report.possiblyNew.length, 0);
});

test('doppioni dello stesso ristorante (edificio + punto, area giochi, centro commerciale): mai nuovi', () => {
  const twice = [place(1, 41.9), place(8, 41.9 + 0.001), place(9, 41.9 + 0.0025), place(2, 42.0)]; // ~111 m and ~280 m from A
  const run1 = compareWithOsm(list, twice, empty, 'd1');
  const run2 = compareWithOsm(list, twice, run1.state, 'd2');
  assert.equal(run2.report.possiblyNew.length, 0);
  assert.equal(run2.report.matched, 2);
  assert.deepEqual(Object.keys(run2.state.unknown), []);
  // the play area is dropped as soon as it is read
  const parsed = parseOverpass([{ type: 'node', id: 5, lat: 41.9, lon: 12, tags: { name: "McDonald's PlayPlace" } }]);
  assert.equal(parsed.length, 0);
});

test('un punto dove c’era un nostro ristorante chiuso: possibile riapertura', () => {
  const shut = mc(43, { opened: false, closedAt: '2026-01-01' });
  const run1 = compareWithOsm([...list, shut], [place(1, 41.9)], empty, 'd1');
  const run2 = compareWithOsm([...list, shut], [place(1, 41.9), place(5, 43)], run1.state, 'd2');
  assert.deepEqual(run2.report.possiblyReopened.map(x => x.mc.id), [shut.id]);
  assert.equal(run2.report.possiblyNew.length, 0);
  const text = reportMarkdown(run2.report, 'd2');
  assert.match(text, /Possibili riaperture \(1\)/);
  assert.match(text, /l'elenco non è stato modificato/);
});

console.log(`\n${passed} OSM checks passed`);
