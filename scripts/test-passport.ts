// Checks the passport (achievements as stamps), the regions album and the levels roadmap rules.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import type { McDonald, Visit } from '../shared/types';
import { ACHIEVEMENT_LIST, getAchievementProgress } from '../src/services/achievements';
import { regionSummaries, regionTier } from '../src/services/regions';
import { STAMP_INK, STAMP_SHAPES, STAMP_SYMBOLS } from '../src/components/stampArt';
import { LEVELS } from '../src/utils/foodTheme';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

let n = 0;
const mc = (over: Partial<McDonald> = {}): McDonald => ({
  id: `mc${String(++n).padStart(4, '0')}`,
  name: "McDonald's Test",
  lat: 43,
  lon: 12,
  region: 'Lazio',
  city: 'Roma',
  address: 'Via Roma 1',
  opened: true,
  ...over,
});
const visit = (m: McDonald, when = new Date(2026, 5, 10, 13, 0).getTime()): Visit => ({
  id: `v${++n}`,
  mcdonaldId: m.id,
  visitedAt: when,
});
const done = (list: McDonald[], visits: Visit[], id: string) => {
  const p = getAchievementProgress(list, visits)[id];
  return p.target > 0 && p.current >= p.target;
};

console.log('Passaporto, album e livelli');

test('ogni timbro ha forma, simbolo e colore disegnati, e un progresso calcolato', () => {
  const ids = new Set<string>();
  const progress = getAchievementProgress([mc()], []);
  for (const a of ACHIEVEMENT_LIST) {
    assert.ok(!ids.has(a.id), `id doppio ${a.id}`);
    ids.add(a.id);
    assert.ok(STAMP_SHAPES[a.shape], `forma mancante ${a.id}`);
    assert.ok(STAMP_SYMBOLS[a.symbol], `simbolo mancante ${a.id}`);
    assert.ok(STAMP_INK[a.family], `colore mancante ${a.id}`);
    assert.ok(progress[a.id], `progresso mancante ${a.id}`);
  }
});

test('gli id dei vecchi achievement sono rimasti, quelli delle serie di giorni no', () => {
  const ids = ACHIEVEMENT_LIST.map(a => a.id);
  for (const old of ['LOCAL_HERO', 'REGIONAL_MASTER', 'NATION_CONQUEROR']) assert.ok(ids.includes(old));
  assert.ok(!ids.some(id => id.startsWith('STREAK')));
});

test('senza visite non si sblocca niente', () => {
  const list = [mc(), mc({ region: 'Abruzzo', city: 'Chieti' })];
  for (const a of ACHIEVEMENT_LIST) assert.ok(!done(list, [], a.id), a.id);
});

test('primo timbro, esploratore e mezza Italia contano le regioni visitate', () => {
  const regions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const list = regions.map(r => mc({ region: r, city: r }));
  assert.ok(done(list, [visit(list[0])], 'FIRST_STAMP'));
  assert.ok(!done(list, list.slice(0, 4).map(m => visit(m)), 'EXPLORER'));
  assert.ok(done(list, list.slice(0, 5).map(m => visit(m)), 'EXPLORER'));
  assert.ok(!done(list, list.slice(0, 9).map(m => visit(m)), 'HALF_ITALY'));
  assert.ok(done(list, list.map(m => visit(m)), 'HALF_ITALY'));
});

test('eroe del quartiere: 5 nella stessa regione', () => {
  const list = Array.from({ length: 6 }, () => mc());
  assert.ok(!done(list, list.slice(0, 4).map(m => visit(m)), 'LOCAL_HERO'));
  assert.ok(done(list, list.slice(0, 5).map(m => visit(m)), 'LOCAL_HERO'));
});

test('tipi di locale: aeroporto, stazione, drive, centro commerciale, area di servizio, e tutti insieme', () => {
  const airport = mc({ name: "McDonald's Ciampino Aeroporto" });
  const station = mc({ name: "McDonald's Roma Termini" });
  const drive = mc({ name: "McDonald's Crotone Drive" });
  const mall = mc({ name: "McDonald's Maximall" });
  const road = mc({ name: "McDonald's Area di servizio Nord" });
  const plain = mc();
  const list = [airport, station, drive, mall, road, plain];
  assert.ok(done(list, [visit(airport)], 'AIRPORT') && !done(list, [visit(airport)], 'STATION'));
  assert.ok(done(list, [visit(station)], 'STATION'));
  assert.ok(done(list, [visit(drive)], 'DRIVE'));
  assert.ok(done(list, [visit(mall)], 'MALL'));
  assert.ok(done(list, [visit(road)], 'HIGHWAY'));
  assert.ok(!done(list, [visit(plain)], 'AIRPORT'));
  assert.ok(!done(list, [airport, station, drive, mall].map(m => visit(m)), 'ALL_KINDS'));
  assert.ok(done(list, [airport, station, drive, mall, road].map(m => visit(m)), 'ALL_KINDS'));
});

test('geografia: nord e sud, isole, metropoli, 30 province', () => {
  const north = mc({ lat: 46.7, region: 'Trentino-Alto Adige', city: 'Bolzano' });
  const south = mc({ lat: 36.7, region: 'Sicilia', city: 'Ragusa' });
  const sardinia = mc({ lat: 40, region: 'Sardegna', city: 'Cagliari' });
  const middle = mc({ lat: 42 });
  const list = [north, south, sardinia, middle];
  assert.ok(!done(list, [visit(north)], 'NORTH_SOUTH'));
  assert.ok(done(list, [visit(north), visit(south)], 'NORTH_SOUTH'));
  assert.ok(!done(list, [visit(south)], 'ISLANDER'));
  assert.ok(done(list, [visit(south), visit(sardinia)], 'ISLANDER'));

  const cities = ['Roma', 'Milano', 'Napoli', 'Torino'].map(city => mc({ city }));
  assert.ok(!done(cities, cities.slice(0, 3).map(m => visit(m)), 'METROPOLITAN'));
  assert.ok(done(cities, cities.map(m => visit(m)), 'METROPOLITAN'));

  const provinces = Array.from({ length: 30 }, (_, i) => mc({ city: `P${i}` }));
  assert.ok(!done(provinces, provinces.slice(0, 29).map(m => visit(m)), 'PROVINCES_30'));
  assert.ok(done(provinces, provinces.map(m => visit(m)), 'PROVINCES_30'));
});

test('rarità: un chiuso visitato conta, uno mai visitato no; pioniere solo entro 30 giorni dall apertura', () => {
  const closed = mc({ opened: false, closedAt: '2026-08-01' });
  const open = mc();
  assert.ok(done([closed, open], [visit(closed)], 'BEFORE_CLOSING'));
  assert.ok(!done([closed, open], [visit(open)], 'BEFORE_CLOSING'));

  const fresh = mc({ addedAt: '2026-06-01' });
  assert.ok(done([fresh], [visit(fresh, new Date(2026, 5, 10, 12).getTime())], 'PIONEER'));
  assert.ok(!done([fresh], [visit(fresh, new Date(2026, 8, 10, 12).getTime())], 'PIONEER'));
  assert.ok(!done([open], [visit(open)], 'PIONEER'));
});

test('segreti: notte, Ferragosto, due nello stesso giorno, il 77°', () => {
  const list = Array.from({ length: 80 }, () => mc({ city: 'Roma' }));
  assert.ok(done(list, [visit(list[0], new Date(2026, 5, 10, 3, 0).getTime())], 'NIGHT_OWL'));
  assert.ok(!done(list, [visit(list[0], new Date(2026, 5, 10, 5, 0).getTime())], 'NIGHT_OWL'));
  assert.ok(done(list, [visit(list[0], new Date(2026, 7, 15, 13, 0).getTime())], 'FERRAGOSTO'));
  assert.ok(!done(list, [visit(list[0], new Date(2026, 7, 16, 13, 0).getTime())], 'FERRAGOSTO'));
  assert.ok(
    done(list, [visit(list[0], new Date(2026, 5, 10, 9).getTime()), visit(list[1], new Date(2026, 5, 10, 20).getTime())], 'DOUBLE'),
  );
  assert.ok(
    !done(list, [visit(list[0], new Date(2026, 5, 10, 9).getTime()), visit(list[1], new Date(2026, 5, 11, 9).getTime())], 'DOUBLE'),
  );
  assert.ok(!done(list, list.slice(0, 76).map(m => visit(m)), 'LUCKY_77'));
  assert.ok(done(list, list.slice(0, 77).map(m => visit(m)), 'LUCKY_77'));
});

test('regioni: completa quando ogni ristorante che conta è visitato; il chiuso mai visitato non blocca', () => {
  const a = mc({ region: 'Molise' });
  const b = mc({ region: 'Molise' });
  const closedNever = mc({ region: 'Molise', opened: false });
  const list = [a, b, closedNever];
  let s = regionSummaries(list, [visit(a)]).find(r => r.region === 'Molise')!;
  assert.deepEqual([s.total, s.visited, s.complete], [2, 1, false]);
  s = regionSummaries(list, [visit(a), visit(b)]).find(r => r.region === 'Molise')!;
  assert.ok(s.complete);
  assert.ok(done(list, [visit(a), visit(b)], 'REGIONAL_MASTER'));
});

test('regioni: un ristorante nuovo la fa passare da oro ad argento, una chiusura non toglie nulla', () => {
  const a = mc({ region: 'Molise' });
  const visits = [visit(a)];
  const complete = regionSummaries([a], visits)[0];
  assert.equal(regionTier(complete, true), 'gold');
  const withNew = regionSummaries([a, mc({ region: 'Molise', addedAt: '2026-09-01' })], visits)[0];
  assert.equal(regionTier(withNew, true), 'silver');
  assert.equal(regionTier(withNew, false), 'progress');
  assert.equal(regionTier({ region: 'X', total: 3, visited: 0, complete: false }, false), 'empty');
  const closedVisited = { ...a, opened: false };
  assert.ok(regionSummaries([closedVisited], visits)[0].complete);
});

test('livelli: sono 12, con le soglie decise', () => {
  assert.deepEqual(
    LEVELS.map(l => l.min),
    [0, 5, 15, 30, 50, 80, 120, 180, 260, 380, 550, 800],
  );
  for (const l of LEVELS) assert.ok(l.name.length > 0 && l.icon);
});

console.log(`\n${passed} controlli superati.`);
