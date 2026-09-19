// Checks which maps app "Portami lì" opens on each device.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { directionsPlan, geoUrl, isMapApp, mapAppUrl, type DirectionsEnv, type MapApp } from '../src/utils/directions';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  androidWebView: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36',
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

const dest = { name: "McDonald's Chieti", lat: 42.344338, lon: 14.135164 };
const env = (ua: string, extra: Partial<DirectionsEnv> = {}): DirectionsEnv => ({
  nativeAndroid: false, ua, maxTouchPoints: 5, saved: null, ...extra,
});

console.log('Indicazioni stradali');

test('iPhone senza scelta salvata: chiede quale app usare (Safari e Chrome)', () => {
  assert.deepEqual(directionsPlan(env(UA.iphoneSafari), dest), { kind: 'choose' });
  assert.deepEqual(directionsPlan(env(UA.iphoneChrome), dest), { kind: 'choose' });
});

test('iPhone con scelta salvata: apre quella app senza chiedere', () => {
  const apps: MapApp[] = ['apple', 'google', 'waze'];
  for (const saved of apps) {
    assert.deepEqual(directionsPlan(env(UA.iphoneSafari, { saved }), dest), { kind: 'open', url: mapAppUrl(saved, dest) });
  }
});

test('Android da web app o Chrome: geo:, cioè l\'app mappe predefinita del telefono', () => {
  assert.deepEqual(directionsPlan(env(UA.androidChrome), dest), { kind: 'open', url: geoUrl(dest) });
});

test('Android app nativa: geo:, e una scelta iPhone eventualmente salvata non conta', () => {
  assert.deepEqual(directionsPlan(env(UA.androidWebView, { nativeAndroid: true, saved: 'waze' }), dest), { kind: 'open', url: geoUrl(dest) });
});

test('computer: Google Maps nel browser', () => {
  const plan = directionsPlan(env(UA.windowsChrome, { maxTouchPoints: 0 }), dest);
  assert.deepEqual(plan, { kind: 'open', url: mapAppUrl('google', dest) });
});

test('indirizzi: destinazione con coordinate, nome codificato', () => {
  assert.equal(geoUrl(dest), 'geo:42.344338,14.135164?q=42.344338,14.135164(McDonald\'s%20Chieti)');
  assert.ok(mapAppUrl('apple', dest).startsWith('https://maps.apple.com/?daddr=42.344338,14.135164'));
  assert.ok(mapAppUrl('apple', dest).includes('q=McDonald\'s%20Chieti'));
  assert.equal(mapAppUrl('google', dest), 'https://www.google.com/maps/dir/?api=1&destination=42.344338,14.135164&travelmode=driving');
  assert.equal(mapAppUrl('waze', dest), 'https://waze.com/ul?ll=42.344338,14.135164&navigate=yes');
});

test('una scelta salvata non valida viene ignorata', () => {
  assert.equal(isMapApp('apple'), true);
  assert.equal(isMapApp('bing'), false);
  assert.equal(isMapApp(null), false);
});

console.log(`\n${passed} controlli superati.`);
