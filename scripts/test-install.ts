// Checks what the install guidance shows on different devices and browsers.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { installHint, type InstallEnv } from '../src/utils/install';
import { isAppleTouchDevice, isInAppBrowser, isMobileDevice, safariUrl } from '../src/utils/platform';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

// Real user-agent strings
const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1',
  iphoneFirefox: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  iphoneEdge: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.2592.87 Mobile/15E148 Safari/605.1.15',
  iphoneInstagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.29.109 (iPhone14,5; iOS 17_5; it_IT; it-IT; scale=3.00; 1170x2532; 570239867)',
  ipadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0',
  androidWebView: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36',
  androidFacebook: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/460.0.0.0.0;]',
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

const env = (ua: string, extra: Partial<InstallEnv> = {}): InstallEnv => ({
  ua, maxTouchPoints: 5, standalone: false, native: false, hasPrompt: false, ...extra,
});

console.log('Guida all\'installazione');

test('iPhone con Safari: istruzioni Condividi → Aggiungi alla schermata Home', () => {
  assert.equal(installHint(env(UA.iphoneSafari)), 'ios');
});

test("iPhone con Chrome, Firefox o Edge: si rimanda a Safari, dove l'installazione funziona davvero", () => {
  assert.equal(installHint(env(UA.iphoneChrome)), 'ios-other');
  assert.equal(installHint(env(UA.iphoneFirefox)), 'ios-other');
  assert.equal(installHint(env(UA.iphoneEdge)), 'ios-other');
});

test('link per aprire in Safari: usa lo schema x-safari e rifiuta indirizzi non web', () => {
  assert.equal(safariUrl('https://givvi00.github.io/mcdonaldz-tracker/'), 'x-safari-https://givvi00.github.io/mcdonaldz-tracker/');
  assert.equal(safariUrl('http://localhost:5173/'), 'x-safari-http://localhost:5173/');
  assert.equal(safariUrl('javascript:alert(1)'), null);
  assert.equal(safariUrl('capacitor://localhost/'), null);
});

test('iPhone dentro Instagram: chiede di aprire nel browser', () => {
  assert.equal(installHint(env(UA.iphoneInstagram)), 'inapp');
});

test('iPad che chiede il sito desktop (si presenta come Mac, ma ha lo schermo touch): riconosciuto', () => {
  assert.equal(installHint(env(UA.ipadDesktopMode, { maxTouchPoints: 5 })), 'ios');
});

test('un vero Mac senza touch: nessuna guida', () => {
  assert.equal(installHint(env(UA.macSafari, { maxTouchPoints: 0 })), 'none');
});

test('Android con Chrome che offre l\'installazione: pulsante "Installa"', () => {
  assert.equal(installHint(env(UA.androidChrome, { hasPrompt: true })), 'prompt');
});

test('Android senza offerta del browser (Firefox, o già rifiutata): istruzioni dal menu', () => {
  assert.equal(installHint(env(UA.androidFirefox)), 'android-manual');
  assert.equal(installHint(env(UA.androidChrome)), 'android-manual');
});

test('WebView e browser incorporati (Facebook) su Android: aprire nel browser', () => {
  assert.equal(installHint(env(UA.androidWebView)), 'inapp');
  assert.equal(installHint(env(UA.androidFacebook)), 'inapp');
});

test('già installata (standalone): nessun invito, segnalata come installata', () => {
  assert.equal(installHint(env(UA.iphoneSafari, { standalone: true })), 'installed');
  assert.equal(installHint(env(UA.androidChrome, { standalone: true, hasPrompt: true })), 'installed');
});

test('dentro l\'app Android (Capacitor): niente guida', () => {
  assert.equal(installHint(env(UA.androidWebView, { native: true })), 'none');
});

test('computer: nessuna guida, salvo il pulsante se il browser offre l\'installazione', () => {
  assert.equal(installHint(env(UA.windowsChrome, { maxTouchPoints: 0 })), 'none');
  assert.equal(installHint(env(UA.windowsChrome, { maxTouchPoints: 0, hasPrompt: true })), 'prompt');
});

test('cosa conta come telefono (la card in Home compare solo lì)', () => {
  assert.equal(isMobileDevice(UA.iphoneSafari, 5), true);
  assert.equal(isMobileDevice(UA.androidChrome, 5), true);
  assert.equal(isMobileDevice(UA.ipadDesktopMode, 5), true);
  assert.equal(isMobileDevice(UA.windowsChrome, 0), false);
  assert.equal(isMobileDevice(UA.macSafari, 0), false);
});

test('riconoscimento di piattaforma: nessun falso positivo tra Apple, Android e browser incorporati', () => {
  assert.equal(isAppleTouchDevice(UA.androidChrome, 5), false);
  assert.equal(isInAppBrowser(UA.iphoneSafari), false);
  assert.equal(isInAppBrowser(UA.androidChrome), false);
  assert.equal(isInAppBrowser(UA.windowsChrome), false);
});

console.log(`\n${passed} controlli superati.`);
