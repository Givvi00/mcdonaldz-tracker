// Checks how open/closed restaurants count in the totals, and what the map popup shows for each.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import type { McDonald } from '../shared/types';
import { countedMcdonalds, isCounted, isNewlyAdded, visitedIdSet } from '../src/utils/catalog';
import { markerBackground, popupHtml } from '../src/utils/mapMarkers';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const mc = (id: string, extra: Partial<McDonald> = {}): McDonald => ({
  id, name: `McDonald's ${id}`, lat: 41, lon: 12, region: 'Lazio', city: 'Roma', address: 'Via Test 1, Roma', opened: true, ...extra,
});
const visit = (id: string) => ({ mcdonaldId: id });

console.log('Conteggio aperti / chiusi e popup');

const open = mc('open');
const openVisited = mc('openVisited');
const closedVisited = mc('closedVisited', { opened: false, closedAt: '2030-01-15' });
const closedUnvisited = mc('closedUnvisited', { opened: false, closedAt: '2030-01-15' });
const all = [open, openVisited, closedVisited, closedUnvisited];
const visits = [visit('openVisited'), visit('closedVisited')];

test('conta: aperti + chiusi visitati; non conta: chiusi mai visitati', () => {
  const visited = visitedIdSet(visits);
  assert.equal(isCounted(open, visited), true);
  assert.equal(isCounted(openVisited, visited), true);
  assert.equal(isCounted(closedVisited, visited), true);
  assert.equal(isCounted(closedUnvisited, visited), false);
});

test('il totale è 3 e le visite (2) non superano mai il totale', () => {
  const counted = countedMcdonalds(all, visits);
  assert.deepEqual(counted.map(m => m.id), ['open', 'openVisited', 'closedVisited']);
  const visitedInCounted = counted.filter(m => visitedIdSet(visits).has(m.id)).length;
  assert.equal(visitedInCounted, 2);
  assert.ok(visitedInCounted <= counted.length);
});

test('se un ristorante visitato chiude, i progressi non cambiano', () => {
  const before = countedMcdonalds([open, mc('willClose')], [visit('willClose')]);
  const after = countedMcdonalds([open, mc('willClose', { opened: false, closedAt: '2030-01-15' })], [visit('willClose')]);
  assert.equal(before.length, after.length);
});

test('se un ristorante NON visitato chiude, il totale scende di uno', () => {
  const before = countedMcdonalds([open, mc('willClose')], []);
  const after = countedMcdonalds([open, mc('willClose', { opened: false, closedAt: '2030-01-15' })], []);
  assert.equal(before.length - after.length, 1);
});

test('se "segni come non visitato" un chiuso, esce dal conteggio', () => {
  assert.equal(countedMcdonalds([closedVisited], [visit('closedVisited')]).length, 1);
  assert.equal(countedMcdonalds([closedVisited], []).length, 0);
});

test('popup di un chiuso: etichetta con data, tasto visita, NIENTE "Portami lì"', () => {
  const html = popupHtml(closedVisited, true);
  assert.match(html, /Chiuso dal 2030-01-15/);
  assert.match(html, /id="toggle-closedVisited"/);
  assert.doesNotMatch(html, /directions-/);
  assert.doesNotMatch(html, /Portami/);
});

test('popup di un aperto: "Portami lì" presente, nessuna etichetta "Chiuso"', () => {
  const html = popupHtml(open, false);
  assert.match(html, /id="directions-open"/);
  assert.match(html, /Segna visita/);
  assert.doesNotMatch(html, /Chiuso/);
});

test('popup di un aperto visitato mostra "Visitato"', () => {
  assert.match(popupHtml(openVisited, true), /✓ Visitato/);
});

test('il testo dei dati viene protetto (nessun HTML iniettato dal nome)', () => {
  const html = popupHtml(mc('x', { name: `McDonald's <img src=x onerror=alert(1)> & Co` }), false);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&amp; Co/);
});

test('"Nuovo" per 30 giorni dall\'aggiunta, poi sparisce; mai per chiusi o senza data', () => {
  const now = Date.parse('2030-02-01');
  assert.equal(isNewlyAdded(mc('a', { addedAt: '2030-01-20' }), now), true);
  assert.equal(isNewlyAdded(mc('b', { addedAt: '2029-12-01' }), now), false);
  assert.equal(isNewlyAdded(mc('c'), now), false);
  assert.equal(isNewlyAdded(mc('d', { addedAt: '2030-01-20', opened: false }), now), false);
  assert.equal(isNewlyAdded(mc('e', { addedAt: 'non-una-data' }), now), false);
});

test('colore del marker: grigio (chiuso), verde (visitato), rosso (da visitare)', () => {
  assert.match(markerBackground(closedVisited, true), /#a8a29e/);
  assert.match(markerBackground(openVisited, true), /#16a34a/);
  assert.match(markerBackground(open, false), /#DA291C/);
});

console.log(`\n${passed} controlli superati.`);
