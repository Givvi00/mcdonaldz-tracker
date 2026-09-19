// Checks the safety rules applied to a restaurant list downloaded by the app.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { McDonald } from '../shared/types';
import { MAX_NEW_RESTAURANTS, validateCatalogUpdate } from '../src/utils/catalogValidation';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const id = (n: number) => `mc${String(n).padStart(4, '0')}`;
const mc = (n: number, extra: Partial<McDonald> = {}): McDonald => ({
  id: id(n), name: `McDonald's ${n}`, lat: 41 + (n % 50) * 0.05, lon: 12 + (n % 50) * 0.05,
  region: 'Lazio', city: 'Roma', address: `Via ${n}, Roma`, opened: true, ...extra,
});
const current = Array.from({ length: 100 }, (_, i) => mc(i + 1));
const copy = () => current.map(m => ({ ...m }));

console.log('Elenco scaricato dall\'app: regole di sicurezza');

test('un elenco identico è accettato', () => {
  assert.equal(validateCatalogUpdate(current, copy()).ok, true);
});

test('un ristorante nuovo è accettato', () => {
  const next = [...copy(), mc(101, { addedAt: '2030-01-15' })];
  const result = validateCatalogUpdate(current, next);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.restaurants.length, 101);
});

test('poche chiusure e una riapertura sono accettate', () => {
  const next = copy();
  next[0] = { ...next[0], opened: false, closedAt: '2030-01-15' };
  next[1] = { ...next[1], opened: false, closedAt: '2030-01-15' };
  const before = copy();
  before[5] = { ...before[5], opened: false, closedAt: '2029-01-01' };
  next[5] = { ...before[5], opened: true, closedAt: undefined };
  assert.equal(validateCatalogUpdate(before, next).ok, true);
});

test('un elenco che perde anche un solo ID è rifiutato', () => {
  const next = copy().filter(m => m.id !== id(50));
  const result = validateCatalogUpdate(current, next);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /mc0050/);
});

test('un elenco vuoto o che non è un elenco è rifiutato', () => {
  assert.equal(validateCatalogUpdate(current, []).ok, false);
  assert.equal(validateCatalogUpdate(current, { restaurants: [] }).ok, false);
  assert.equal(validateCatalogUpdate(current, null).ok, false);
  assert.equal(validateCatalogUpdate(current, 'ciao').ok, false);
});

test('troppe chiusure in un colpo solo (fonte sbagliata) sono rifiutate', () => {
  const next = copy().map((m, i) => (i < 20 ? { ...m, opened: false, closedAt: '2030-01-15' } : m));
  const result = validateCatalogUpdate(current, next);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /chiusure/);
});

test('un numero implausibile di ristoranti nuovi è rifiutato', () => {
  const extra = Array.from({ length: MAX_NEW_RESTAURANTS + 1 }, (_, i) => mc(1000 + i));
  assert.equal(validateCatalogUpdate(current, [...copy(), ...extra]).ok, false);
});

test('ID duplicati, ID malformati e voci non valide sono rifiutati', () => {
  assert.equal(validateCatalogUpdate(current, [...copy(), mc(7)]).ok, false);
  assert.equal(validateCatalogUpdate(current, [...copy(), { ...mc(101), id: 'xyz' }]).ok, false);
  assert.equal(validateCatalogUpdate(current, [...copy(), null]).ok, false);
});

test('campi mancanti o di tipo sbagliato sono rifiutati', () => {
  const broken = (patch: Record<string, unknown>) => [...copy(), { ...mc(101), ...patch }];
  assert.equal(validateCatalogUpdate(current, broken({ name: '' })).ok, false);
  assert.equal(validateCatalogUpdate(current, broken({ region: undefined })).ok, false);
  assert.equal(validateCatalogUpdate(current, broken({ city: 5 })).ok, false);
  assert.equal(validateCatalogUpdate(current, broken({ opened: 'true' })).ok, false);
  assert.equal(validateCatalogUpdate(current, broken({ address: undefined })).ok, false);
});

test('coordinate fuori dall\'Italia o non numeriche sono rifiutate', () => {
  const broken = (patch: Record<string, unknown>) => [...copy(), { ...mc(101), ...patch }];
  assert.equal(validateCatalogUpdate(current, broken({ lat: 0, lon: 0 })).ok, false);
  assert.equal(validateCatalogUpdate(current, broken({ lat: 60 })).ok, false);
  assert.equal(validateCatalogUpdate(current, broken({ lon: 'x' })).ok, false);
  assert.equal(validateCatalogUpdate(current, broken({ lat: NaN })).ok, false);
});

test('date con formato sbagliato sono rifiutate', () => {
  assert.equal(validateCatalogUpdate(current, [...copy(), mc(101, { addedAt: '15/01/2030' })]).ok, false);
  assert.equal(validateCatalogUpdate(current, [...copy(), mc(101, { closedAt: 'ieri', opened: false })]).ok, false);
});

test('anche i dati reali del progetto sono un elenco valido rispetto a sé stessi', () => {
  const real: McDonald[] = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../shared/data/mcdonalds.json'), 'utf-8'));
  const result = validateCatalogUpdate(real, real.map(m => ({ ...m })));
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

console.log(`\n${passed} controlli superati.`);
