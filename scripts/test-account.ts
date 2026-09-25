// Checks that what Supabase answers while signing in becomes a clear Italian message (src/services/account.ts).
// The texts and codes are those Supabase Auth really returns. Run with: npm run test:data
import assert from 'node:assert/strict';
import { NotInvitedError, explain } from '../src/services/account';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

test('an email with no account can ask to join', () => {
  assert.ok(explain({ code: 'otp_disabled', message: 'Signups not allowed for otp', status: 422 }) instanceof NotInvitedError);
});

test('a new code asked too soon says how long to wait', () => {
  const e = explain({
    code: 'over_email_send_rate_limit',
    message: 'For security purposes, you can only request this after 42 seconds.',
    status: 429,
  });
  assert.match(e.message, /aspetta 42 secondi/);
});

test('a badly written email is not called a wrong code', () => {
  const e = explain({ code: 'email_address_invalid', message: 'Email address "mario@" is invalid', status: 400 });
  assert.match(e.message, /Email non valida/);
});

test('a wrong or old code', () => {
  const e = explain({ code: 'otp_expired', message: 'Token has expired or is invalid', status: 403 });
  assert.match(e.message, /Codice sbagliato o scaduto/);
});

test('too many attempts in general', () => {
  assert.match(explain({ code: 'over_request_rate_limit', message: 'Request rate limit reached', status: 429 }).message, /Troppi tentativi/);
});

test('no connection', () => {
  assert.match(explain({ message: 'Failed to fetch' }).message, /offline/);
});

console.log(`\n${passed} account checks passed`);
