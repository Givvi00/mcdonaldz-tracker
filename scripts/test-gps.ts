// Checks the rule that decides whether a GPS reading proves you are at a restaurant, and when "Verifica ora" is offered.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { canOfferVerify, judgeFix } from '../src/services/gpsCheck';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const mc = { lat: 42.415848, lon: 14.167749 };
// About 111 m per 0.001 degrees of latitude
const north = (metres: number) => mc.lat + metres / 111_000;

test('vicino e preciso: verificata', () => {
  assert.deepEqual(judgeFix({ lat: mc.lat, lon: mc.lon, accuracy: 15 }, mc), { result: 'ok' });
  assert.deepEqual(judgeFix({ lat: north(150), lon: mc.lon, accuracy: 30 }, mc), { result: 'ok' });
});

test('preciso ma lontano: dice quanto', () => {
  const out = judgeFix({ lat: north(500), lon: mc.lon, accuracy: 20 }, mc);
  assert.equal(out.result, 'far');
  assert.ok(out.result === 'far' && out.distanceM > 450 && out.distanceM < 550);
  // just outside the radius, precise: still far
  assert.equal(judgeFix({ lat: north(260), lon: mc.lon, accuracy: 10 }, mc).result, 'far');
});

test('segnale impreciso vicino: non basta, e lo dice', () => {
  const out = judgeFix({ lat: mc.lat, lon: mc.lon, accuracy: 800 }, mc);
  assert.deepEqual(out, { result: 'imprecise', accuracyM: 800 });
});

test('lontanissimo anche con segnale impreciso: dice che sei lontano, non che il segnale è debole', () => {
  assert.equal(judgeFix({ lat: north(20_000), lon: mc.lon, accuracy: 1500 }, mc).result, 'far');
});

test('nessuna posizione: non disponibile', () => {
  assert.deepEqual(judgeFix(null, mc), { result: 'unavailable' });
});

test('"Verifica ora": solo per una visita non verificata, quando sembri lì', () => {
  const here = { lat: mc.lat, lon: mc.lon };
  assert.equal(canOfferVerify({}, mc, here), true);
  assert.equal(canOfferVerify({ verified: true }, mc, here), false);
  assert.equal(canOfferVerify(undefined, mc, here), false);
  assert.equal(canOfferVerify({}, mc, null), false);
  assert.equal(canOfferVerify({}, mc, { lat: north(5000), lon: mc.lon }), false);
});

console.log(`\n${passed} GPS checks passed`);
