// Checks the version list (src/data/changelog.ts): newest first, same number as package.json, and who sees the popup.
// Run with: npm run test:data
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHANGELOG, newerThan, unseenChanges } from '../src/data/changelog';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

test('the newest version is first and is the one in package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
  assert.equal(pkg.version.replace(/\.0$/, ''), CHANGELOG[0].version, 'update "version" in package.json too');
  for (let i = 1; i < CHANGELOG.length; i++) assert.ok(newerThan(CHANGELOG[i - 1].version, CHANGELOG[i].version), CHANGELOG[i].version);
  for (const e of CHANGELOG) assert.ok(e.items.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(e.date), e.version);
});

test('versions compare as numbers', () => {
  assert.ok(newerThan('1.10', '1.9'));
  assert.ok(!newerThan('1.1', '1.1'));
  assert.ok(newerThan('2.0', '1.12'));
});

test('who sees the popup', () => {
  assert.deepEqual(unseenChanges(null, false), [], 'a new install: the guide explains the app');
  assert.deepEqual(unseenChanges(null, true).map(e => e.version), [CHANGELOG[0].version], 'used before versions were counted');
  assert.deepEqual(unseenChanges(CHANGELOG[0].version, true), [], 'already seen');
  assert.equal(unseenChanges('0.1', true).length, CHANGELOG.length, 'several versions skipped: all of them, none left out');
});

console.log(`\n${passed} changelog checks passed`);
