// Checks the McDonald's-themed rules: levels, tray, restaurant kind, map marker emoji.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { markerSymbol, popupHtml } from '../src/utils/mapMarkers';
import { FOOD_EMOJI, LEVELS, TRAY_SLOTS, levelInfo, markerEmoji, restaurantKind, trayFilled } from '../src/utils/foodTheme';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log('Tema McDonald\'s');

test('livelli: soglie in ordine crescente, si parte da zero', () => {
  assert.equal(LEVELS[0].min, 0);
  for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i].min > LEVELS[i - 1].min);
});

test('livello: 0 visite è Happy Meal e mancano 5 al successivo', () => {
  const info = levelInfo(0);
  assert.equal(info.level.name, 'Happy Meal');
  assert.equal(info.next?.name, 'Cheeseburger');
  assert.equal(info.toNext, 5);
});

test('livello: la soglia esatta sale di livello, quella prima no', () => {
  assert.equal(levelInfo(4).level.name, 'Happy Meal');
  assert.equal(levelInfo(5).level.name, 'Cheeseburger');
  assert.equal(levelInfo(14).level.name, 'Cheeseburger');
  assert.equal(levelInfo(15).level.name, 'Menu Medium');
  assert.equal(levelInfo(14).toNext, 1);
});

test('livello massimo: nessun successivo, nulla da guadagnare', () => {
  const top = LEVELS[LEVELS.length - 1];
  const info = levelInfo(top.min + 500);
  assert.equal(info.level.name, top.name);
  assert.equal(info.next, null);
  assert.equal(info.toNext, 0);
});

test('livello: valori strani (negativi, decimali) non rompono nulla', () => {
  assert.equal(levelInfo(-3).level.name, 'Happy Meal');
  assert.equal(levelInfo(5.9).level.name, 'Cheeseburger');
});

test('vassoio: si riempie man mano e non perde pezzi', () => {
  assert.deepEqual(trayFilled(0), TRAY_SLOTS.map(() => false));
  assert.equal(trayFilled(1).filter(Boolean).length, 1);
  assert.equal(trayFilled(5).filter(Boolean).length, 2);
  assert.equal(trayFilled(9999).every(Boolean), true);
  for (let v = 1; v < 200; v++) {
    assert.ok(trayFilled(v).filter(Boolean).length >= trayFilled(v - 1).filter(Boolean).length);
  }
});

test('tipo di locale: riconosciuto dal nome e dall\'indirizzo', () => {
  const kind = (name: string, address = '') => restaurantKind({ name, address })?.emoji ?? null;
  assert.equal(kind("McDonald's Napoli Aeroporto"), '✈️');
  assert.equal(kind("McDonald's Salerno Stazione"), '🚉');
  assert.equal(kind("McDonald's Crotone Drive"), '🚗');
  assert.equal(kind("McDonald's Marcianise Uscita A1"), '⛽');
  assert.equal(kind("McDonald's Roncadelle Mall"), '🛍️');
  assert.equal(kind("McDonald's Chieti", 'Viale Abruzzo, Chieti'), null);
});

test('tipo di locale: una città con nome di aeroporto non è un aeroporto (Ciampino)', () => {
  assert.equal(restaurantKind({ name: "McDonald's Ciampino", address: 'Viale Kennedy, 90, Roma' }), null);
  assert.equal(restaurantKind({ name: "McDonald's Ciampino Aeroporto", address: '' })?.emoji, '✈️');
});

test('tipo di locale sui dati veri: solo una minoranza ha un\'icona, nessuna eccezione', () => {
  const all = JSON.parse(readFileSync(new URL('../shared/data/mcdonalds.json', import.meta.url), 'utf8')) as Array<{ name: string; address: string }>;
  const withKind = all.filter(mc => restaurantKind(mc)).length;
  assert.ok(withKind > 50, `troppo poche: ${withKind}`);
  assert.ok(withKind < all.length * 0.4, `troppe: ${withKind}`);
});

test('emoji del marker: sempre lo stesso per lo stesso ristorante, e sono cibo', () => {
  assert.equal(markerEmoji('mc0001'), markerEmoji('mc0001'));
  for (let i = 1; i <= 828; i++) assert.ok((FOOD_EMOJI as readonly string[]).includes(markerEmoji(`mc${String(i).padStart(4, '0')}`)));
});

test('emoji del marker: distribuiti tra tutti i tipi, non un solo emoji', () => {
  const used = new Set<string>();
  for (let i = 1; i <= 828; i++) used.add(markerEmoji(`mc${String(i).padStart(4, '0')}`));
  assert.equal(used.size, FOOD_EMOJI.length);
});

test('marker: la spunta se visitato, altrimenti il cibo del ristorante', () => {
  const mc = { id: 'mc0007', name: "McDonald's Test", lat: 0, lon: 0, region: 'X', city: 'Y', address: 'Z', opened: true };
  assert.equal(markerSymbol(mc, true), '✓');
  assert.equal(markerSymbol(mc, false), markerEmoji('mc0007'));
});

test('popup: un locale speciale mostra la sua icona, uno normale no', () => {
  const base = { id: 'mc0008', lat: 0, lon: 0, region: 'X', city: 'Y', opened: true };
  assert.ok(popupHtml({ ...base, name: "McDonald's Crotone Drive", address: 'Via A' }, false).includes('🚗 McDonald'));
  assert.ok(!popupHtml({ ...base, name: "McDonald's Chieti", address: 'Viale Abruzzo' }, false).includes('🚗'));
});

console.log(`\n${passed} controlli superati.`);
