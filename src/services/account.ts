// The online account: sign in with a code sent by email, and the online copy of the data (see sync.ts).
// The Supabase library is loaded only when needed (someone signed in on this phone, or opening the sign-in), so the
// app stays as light as before for everyone else.
import type { SupabaseClient } from '@supabase/supabase-js';
import { NameTakenError, type Remote, type RemoteAchievement, type RemoteVisit } from './sync';

// Public by design: what protects the data are the rules in supabase/migrations (each account sees only its own rows)
const SUPABASE_URL = 'https://krfhynrhictmtolqkpas.supabase.co';
const SUPABASE_KEY = 'sb_publishable_H-jhJDdrTnyGjSAQTsadNA_LohmE4FN';
/** Where the library keeps the session in localStorage */
const SESSION_KEY = 'mcdz-auth';

let clientPromise: Promise<SupabaseClient> | null = null;

export function getClient(): Promise<SupabaseClient> {
  clientPromise ??= import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { storageKey: SESSION_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      }),
    )
    .catch(error => {
      clientPromise = null; // offline before it was ever downloaded: try again later
      throw error;
    });
  return clientPromise;
}

/** Someone signed in on this phone (read without loading the library) */
export function hasStoredSession(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

export interface Account {
  id: string;
  email: string;
}

export async function currentAccount(): Promise<Account | null> {
  const client = await getClient();
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  return user ? { id: user.id, email: user.email ?? '' } : null;
}

/** The email has no account: the person can ask to join (see requestAccess) */
export class NotInvitedError extends Error {
  constructor() {
    super('Questa email non è ancora dentro McDonaldz.');
  }
}

/** Readable Italian for what can go wrong while signing in (exported for the tests) */
export function explain(error: { message?: string; status?: number; code?: string }): Error {
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  if (text.includes('signup') || text.includes('not allowed') || text.includes('user_not_found')) {
    return new NotInvitedError();
  }
  // A new code for the same email is allowed once a minute: "...you can only request this after 42 seconds"
  const wait = /after (\d+) seconds?/.exec(text);
  if (wait) {
    return new Error(`Hai appena chiesto un codice: aspetta ${wait[1]} secondi e riprova.`);
  }
  if (text.includes('email_address_invalid') || (text.includes('email') && text.includes('invalid') && !text.includes('token'))) {
    return new Error('Email non valida: controlla di averla scritta bene.');
  }
  if (text.includes('rate') || error.status === 429) {
    return new Error('Troppi tentativi: aspetta qualche minuto e riprova.');
  }
  if (text.includes('expired') || text.includes('invalid') || text.includes('otp')) {
    return new Error('Codice sbagliato o scaduto. Controlla l\'ultima email o chiedine uno nuovo.');
  }
  if (text.includes('fetch') || text.includes('network')) {
    return new Error('Non riesco a collegarmi: sei offline?');
  }
  return new Error(error.message || 'Qualcosa è andato storto, riprova.');
}

/** Sends the code (only to accounts that already exist: nobody can sign up on their own) */
export async function sendCode(email: string): Promise<void> {
  const client = await getClient();
  const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
  if (error) throw explain(error);
}

export async function confirmCode(email: string, code: string): Promise<Account> {
  const client = await getClient();
  const { data, error } = await client.auth.verifyOtp({ email: email.trim(), token: code.replace(/\s/g, ''), type: 'email' });
  if (error || !data.user) throw explain(error ?? {});
  return { id: data.user.id, email: data.user.email ?? email };
}

/** Calls one of the server functions in supabase/functions (public: they check everything themselves) */
async function callFunction<T>(name: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Non riesco a collegarmi: sei offline?');
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error === 'not-found' ? 'Richiesta non trovata o link non valido.' : 'Qualcosa è andato storto, riprova.');
  return data;
}

export type AccessRequestResult = 'sent' | 'pending' | 'exists' | 'busy';

/** Asks the owner to let this email in: they get an email and accept or refuse */
export async function requestAccess(email: string, name: string): Promise<AccessRequestResult> {
  const { status } = await callFunction<{ status: AccessRequestResult }>('request-access', { email: email.trim(), name: name.trim() });
  return status;
}

export interface AccessRequest {
  email: string;
  name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  /** After approving: whether the code left for the person */
  codeSent?: boolean;
}

/** The owner's side, from the link in the email: see the request, accept or refuse it */
export function reviewAccess(id: string, token: string, action: 'view' | 'approve' | 'reject'): Promise<AccessRequest> {
  return callFunction<AccessRequest>('review-access', { id, token, action });
}

/** Whether nobody else has this name online (yours counts as free) */
export async function isNameAvailable(name: string): Promise<boolean> {
  const client = await getClient();
  const { data, error } = await client.rpc('name_available', { candidate: name.trim() });
  if (error) throw explain(error);
  return data === true;
}

/** Ends the session on this phone (the store then clears the data here: it is all in the account) */
export async function signOut(): Promise<void> {
  const client = await getClient();
  await client.auth.signOut({ scope: 'local' });
}

/** Deletes the account and everything online (the app then clears this phone too, see the store) */
export async function deleteAccount(): Promise<void> {
  const client = await getClient();
  const { error } = await client.rpc('delete_my_account');
  if (error) throw explain(error);
  await client.auth.signOut({ scope: 'local' });
}

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** The online copy of the signed-in account */
export function supabaseRemote(client: SupabaseClient, accountId: string): Remote {
  return {
    async listVisits() {
      return check(await client.from('visits').select('mcdonald_id, visited_at, date_edited, verified, verified_at, rating')) as RemoteVisit[];
    },
    async upsertVisits(rows) {
      check(await client.from('visits').upsert(rows.map(r => ({ ...r, user_id: accountId })), { onConflict: 'user_id,mcdonald_id' }));
    },
    async deleteVisits(ids) {
      check(await client.from('visits').delete().eq('user_id', accountId).in('mcdonald_id', ids));
    },
    async listAchievements() {
      return check(await client.from('achievements').select('type, unlocked_at, value')) as RemoteAchievement[];
    },
    async addAchievements(rows) {
      check(
        await client
          .from('achievements')
          .upsert(rows.map(r => ({ ...r, user_id: accountId })), { onConflict: 'user_id,type', ignoreDuplicates: true }),
      );
    },
    async getName() {
      const row = check(await client.from('profiles').select('name').eq('id', accountId).maybeSingle()) as { name: string | null } | null;
      return row ? row.name : undefined;
    },
    async setName(name) {
      const result = await client.from('profiles').upsert({ id: accountId, name }, { onConflict: 'id' });
      // 23505: the unique index on the name (supabase/migrations/0002_unique_names.sql)
      if (result.error?.code === '23505' && name) throw new NameTakenError(name);
      check(result);
    },
  };
}
