// Checks the McDonald's-themed rules: levels, restaurant kind, map marker icons, the icon sprite.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { markerSymbol, popupHtml } from '../src/utils/mapMarkers';
import { FOOD_SPRITE } from '../src/components/foodSprite';
import { FOOD_ICONS, LEVELS, foodIconSvg, levelInfo, markerIcon, restaurantKind } from '../src/utils/foodTheme';

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

test('livello: 0 visite è il livello 1 e mancano 5 al successivo', () => {
  const info = levelInfo(0);
  assert.equal(info.level.name, 'Assaggiatore');
  assert.equal(info.number, 1);
  assert.equal(info.next?.name, 'Cliente abituale');
  assert.equal(info.toNext, 5);
});

test('livello: la soglia esatta sale di livello, quella prima no', () => {
  assert.equal(levelInfo(4).level.name, 'Assaggiatore');
  assert.equal(levelInfo(5).level.name, 'Cliente abituale');
  assert.equal(levelInfo(5).number, 2);
  assert.equal(levelInfo(14).level.name, 'Cliente abituale');
  assert.equal(levelInfo(15).level.name, 'Divoratore di panini');
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
  assert.equal(levelInfo(-3).level.name, 'Assaggiatore');
  assert.equal(levelInfo(5.9).level.name, 'Cliente abituale');
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

test('icona del marker: sempre la stessa per lo stesso ristorante, e è una delle nostre', () => {
  assert.equal(markerIcon('mc0001'), markerIcon('mc0001'));
  for (let i = 1; i <= 828; i++) assert.ok((FOOD_ICONS as readonly string[]).includes(markerIcon(`mc${String(i).padStart(4, '0')}`)));
});

test('icona del marker: distribuite tra tutte le icone, non una sola', () => {
  const used = new Set<string>();
  for (let i = 1; i <= 828; i++) used.add(markerIcon(`mc${String(i).padStart(4, '0')}`));
  assert.equal(used.size, FOOD_ICONS.length);
});

test('sprite: ogni icona ha il suo disegno, e nessun id è doppio', () => {
  const ids = [...FOOD_SPRITE.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  for (const name of FOOD_ICONS) assert.ok(ids.includes(`food-${name}`), `manca food-${name}`);
  assert.equal(new Set(ids).size, ids.length, 'id ripetuti nello sprite');
});

test('sprite: ogni clip path usata esiste', () => {
  const used = new Set([...FOOD_SPRITE.matchAll(/url\(#([^)]+)\)/g)].map(m => m[1]));
  for (const id of used) assert.ok(FOOD_SPRITE.includes(` id="${id}"`), `clip mancante: ${id}`);
  assert.ok(used.size > 0);
});

test("markup di un'icona: misura e riferimento allo sprite", () => {
  const svg = foodIconSvg('burger', 20);
  assert.ok(svg.includes('width="20"') && svg.includes('href="#food-burger"'));
});

test('marker: la spunta se visitato, altrimenti nessun simbolo', () => {
  const mc = { id: 'mc0007', name: "McDonald's Test", lat: 0, lon: 0, region: 'X', city: 'Y', address: 'Z', opened: true };
  assert.equal(markerSymbol(mc, true), '✓');
  assert.equal(markerSymbol(mc, false), '');
});

test('popup: un locale speciale mostra la sua icona, uno normale no', () => {
  const base = { id: 'mc0008', lat: 0, lon: 0, region: 'X', city: 'Y', opened: true };
  assert.ok(popupHtml({ ...base, name: "McDonald's Crotone Drive", address: 'Via A' }, false).includes('🚗 McDonald'));
  assert.ok(!popupHtml({ ...base, name: "McDonald's Chieti", address: 'Viale Abruzzo' }, false).includes('🚗'));
  assert.ok(popupHtml({ ...base, name: "McDonald's Chieti", address: 'Viale Abruzzo' }, false).includes('#food-fries'));
});

console.log(`\n${passed} controlli superati.`);
