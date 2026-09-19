// Checks the rules that protect visit history when the restaurant list is refreshed.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import path from 'path';
import type { McDonald } from '../shared/types';
import { changeRatio, mergeCatalog, type RawEntry } from './lib/merge';

const TODAY = '2030-01-15';
let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const mc = (id: string, name: string, city: string, lat: number, lon: number, extra: Partial<McDonald> = {}): McDonald => ({
  id, name: `McDonald's ${name}`, lat, lon, region: 'Lazio', city, address: `Via Test 1, ${city}`, opened: true, ...extra,
});
const rawOf = (m: McDonald): RawEntry => ({
  slug: m.id, name: m.name, region: m.region, citySlug: m.city.toLowerCase(), city: m.city,
  street: m.address.replace(`, ${m.city}`, ''), phone: '', lat: m.lat, lng: m.lon,
});

console.log('Aggiornamento elenco ristoranti');

test('un elenco identico non cambia nulla', () => {
  const list = [mc('mc0001', 'Roma A', 'Roma', 41.9, 12.5), mc('mc0002', 'Roma B', 'Roma', 41.95, 12.55)];
  const { catalog, report } = mergeCatalog(list, list.map(rawOf), { today: TODAY });
  assert.deepEqual(catalog, list);
  assert.equal(report.unchanged, 2);
  assert.equal(report.added.length + report.closed.length + report.reopened.length + report.updated.length, 0);
});

test('un nuovo ristorante che in ordine alfabetico verrebbe PRIMA non sposta gli ID esistenti', () => {
  const list = [mc('mc0001', 'Roma B', 'Roma', 41.9, 12.5), mc('mc0002', 'Roma C', 'Roma', 41.95, 12.55)];
  const fresh = [mc('x', 'Roma A', 'Roma', 42.5, 12.9), ...list].map(rawOf);
  const { catalog, report } = mergeCatalog(list, fresh, { today: TODAY });
  assert.equal(catalog.find(c => c.name === "McDonald's Roma B")!.id, 'mc0001');
  assert.equal(catalog.find(c => c.name === "McDonald's Roma C")!.id, 'mc0002');
  assert.equal(report.added[0].id, 'mc0003');
  assert.equal(report.added[0].addedAt, TODAY);
});

test('un ristorante sparito viene chiuso, non cancellato, con la data', () => {
  const list = [mc('mc0001', 'Roma A', 'Roma', 41.9, 12.5), mc('mc0002', 'Roma B', 'Roma', 41.95, 12.55)];
  const { catalog, report } = mergeCatalog(list, [rawOf(list[0])], { today: TODAY });
  assert.equal(catalog.length, 2);
  assert.equal(catalog[1].opened, false);
  assert.equal(catalog[1].closedAt, TODAY);
  assert.equal(report.closed.length, 1);
});

test('un ristorante già chiuso non viene "richiuso": la data resta quella originale', () => {
  const list = [mc('mc0001', 'Roma A', 'Roma', 41.9, 12.5), mc('mc0002', 'Roma B', 'Roma', 41.95, 12.55, { opened: false, closedAt: '2029-05-01' })];
  const { catalog, report } = mergeCatalog(list, [rawOf(list[0])], { today: TODAY });
  assert.equal(catalog[1].closedAt, '2029-05-01');
  assert.equal(report.closed.length, 0);
});

test('un ristorante chiuso che ricompare viene riaperto con lo stesso ID', () => {
  const list = [mc('mc0001', 'Roma A', 'Roma', 41.9, 12.5, { opened: false, closedAt: '2029-05-01' })];
  const { catalog, report } = mergeCatalog(list, list.map(rawOf), { today: TODAY });
  assert.equal(catalog[0].id, 'mc0001');
  assert.equal(catalog[0].opened, true);
  assert.equal(catalog[0].closedAt, undefined);
  assert.equal(report.reopened.length, 1);
});

test('un ID non viene mai riusato, nemmeno se l\'ultimo ristorante è chiuso', () => {
  const list = [mc('mc0001', 'Roma A', 'Roma', 41.9, 12.5), mc('mc0002', 'Roma B', 'Roma', 41.95, 12.55, { opened: false, closedAt: '2029-05-01' })];
  const fresh = [rawOf(list[0]), rawOf(mc('x', 'Nuovo', 'Roma', 42.4, 12.8))];
  const { report } = mergeCatalog(list, fresh, { today: TODAY });
  assert.equal(report.added[0].id, 'mc0003');
});

test('un ristorante rinominato nello stesso punto mantiene l\'ID', () => {
  const list = [mc('mc0001', 'Roma Termini', 'Roma', 41.9, 12.5)];
  const renamed = { ...rawOf(list[0]), name: "McDonald's Roma Stazione Termini" };
  const { catalog, report } = mergeCatalog(list, [renamed], { today: TODAY });
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, 'mc0001');
  assert.equal(catalog[0].name, "McDonald's Roma Stazione Termini");
  assert.equal(report.updated.length, 1);
});

test('un ristorante spostato (stesso nome e città) mantiene l\'ID e prende le nuove coordinate', () => {
  const list = [mc('mc0001', 'Chieti', 'Chieti', 42.34, 14.13)];
  const moved = { ...rawOf(list[0]), lat: 42.345, lng: 14.14 };
  const { catalog, report } = mergeCatalog(list, [moved], { today: TODAY });
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, 'mc0001');
  assert.equal(catalog[0].lat, 42.345);
  assert.match(report.updated[0].changes.join(' '), /spostato/);
});

test('l\'ordine della nuova raccolta non conta', () => {
  const list = [mc('mc0001', 'A', 'Roma', 41.9, 12.5), mc('mc0002', 'B', 'Milano', 45.4, 9.1), mc('mc0003', 'C', 'Napoli', 40.8, 14.2)];
  const forward = mergeCatalog(list, list.map(rawOf), { today: TODAY }).catalog;
  const backward = mergeCatalog(list, [...list].reverse().map(rawOf), { today: TODAY }).catalog;
  assert.deepEqual(forward, backward);
});

test('dati reali: 2 chiusi e 2 nuovi su 828, raccolta in ordine inverso, nessun ID cambia', () => {
  const file = path.resolve(import.meta.dirname, '../shared/data/mcdonalds.json');
  const real: McDonald[] = JSON.parse(readFileSync(file, 'utf-8'));
  const removed = [real[10], real[500]];
  const kept = real.filter(m => !removed.includes(m));
  const newcomers = [mc('x', 'Nuovo Uno', 'Bari', 41.1, 16.87), mc('x', 'Nuovo Due', 'Lecce', 40.35, 18.17)];
  const fresh = [...kept, ...newcomers].map(rawOf).reverse();

  const { catalog, report } = mergeCatalog(real, fresh, { today: TODAY });
  assert.equal(report.closed.length, 2);
  assert.equal(report.added.length, 2);
  assert.equal(catalog.length, real.length + 2);
  assert.deepEqual(report.closed.map(m => m.id).sort(), removed.map(m => m.id).sort());
  for (const original of real) {
    const now = catalog.find(c => c.id === original.id)!;
    assert.ok(now, `l'ID ${original.id} è sparito`);
    assert.equal(now.name, original.name, `l'ID ${original.id} ora punta a un altro ristorante`);
  }
  const maxId = Math.max(...real.map(m => Number(m.id.slice(2))));
  assert.deepEqual(report.added.map(m => m.id), [`mc${String(maxId + 1).padStart(4, '0')}`, `mc${String(maxId + 2).padStart(4, '0')}`]);
  // Merging the same scrape again changes nothing more
  const again = mergeCatalog(catalog, fresh, { today: '2030-02-01' });
  assert.equal(again.report.added.length + again.report.closed.length + again.report.reopened.length, 0);
  assert.deepEqual(again.catalog, catalog);
  assert.ok(changeRatio(real, report) < 0.05);
});

test('un file di raccolta quasi vuoto supera il limite di sicurezza', () => {
  const list = Array.from({ length: 100 }, (_, i) => mc(`mc${String(i + 1).padStart(4, '0')}`, `R${i}`, `Città${i}`, 40 + i * 0.05, 10 + i * 0.05));
  const { report } = mergeCatalog(list, list.slice(0, 10).map(rawOf), { today: TODAY });
  assert.ok(changeRatio(list, report) > 0.05);
});

console.log(`\n${passed} controlli superati.`);
