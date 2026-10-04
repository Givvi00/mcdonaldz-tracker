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
        // pkce: "Accedi con Google" comes back with a one-time code in the address, exchanged by finishGoogle()
        auth: { storageKey: SESSION_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
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
  /** Signs in with a password (chosen in the app) or with Google: false means the app asks for a password */
  hasPassword?: boolean;
}

type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> };

function toAccount(user: AuthUser, fallbackEmail = ''): Account {
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
  return {
    id: user.id,
    email: user.email ?? fallbackEmail,
    // The password is not readable: the app writes a mark next to it when you choose one (setPassword)
    hasPassword: user.user_metadata?.has_password === true || providers.includes('google'),
  };
}

export async function currentAccount(): Promise<Account | null> {
  const client = await getClient();
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  return user ? toAccount(user) : null;
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
    return new Error("Codice sbagliato o scaduto. Controlla l'ultima email o chiedine uno nuovo.");
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
  return toAccount(data.user, email);
}

/** With a password set from the Profile (see setPassword): the alternative to the code */
export async function signInWithPassword(email: string, password: string): Promise<Account> {
  const client = await getClient();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) {
    const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
    if (text.includes('invalid') && text.includes('credentials')) {
      throw new Error('Email o password sbagliate. Prima volta qui o password dimenticata? Ricevi un codice qui sotto.');
    }
    throw explain(error ?? {});
  }
  // In with a password, so there is one: a password chosen before the mark existed (version 1.1) gets it now
  if (data.user.user_metadata?.has_password !== true) {
    await client.auth.updateUser({ data: { has_password: true } }).catch(() => undefined);
  }
  return { ...toAccount(data.user, email), hasPassword: true };
}

/** Sets or changes the password of the account you are signed in to (at least 8 characters) */
export async function setPassword(password: string): Promise<void> {
  const client = await getClient();
  const { error } = await client.auth.updateUser({ password, data: { has_password: true } });
  if (error) {
    if (/weak|short|characters/i.test(error.message)) throw new Error('Password troppo debole: usane una più lunga, con lettere e numeri.');
    // Already your password (chosen before the mark existed): nothing to change, only the mark is missing
    if (/same|different/i.test(error.message)) {
      const marked = await client.auth.updateUser({ data: { has_password: true } });
      if (marked.error) throw explain(marked.error);
      return;
    }
    throw explain(error);
  }
}

/** Whether "Accedi con Google" is switched on in Supabase (public settings): the button shows only then */
export async function googleEnabled(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } });
    const settings = (await response.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}

// "Accedi con Google" with Google's own button, inside the page: Google hands the app a signed proof of who you are and
// Supabase turns it into a session. The app never leaves, and Google's screen names this site, not Supabase's address.
// The redirect below (signInWithGoogle) stays as the fallback when Google's button cannot load.

/** Public by design, like the Supabase key: the web client of Google Cloud project McDonaldz */
const GOOGLE_CLIENT_ID = '819536678680-v5mvbnoq3nvvgug8g93a4lbo7c1nova1.apps.googleusercontent.com';

type GoogleCredential = { credential: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: object): void;
      renderButton(container: HTMLElement, options: object): void;
    };
  };
};

let identityPromise: Promise<GoogleIdentity> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  identityPromise ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const google = (window as { google?: GoogleIdentity }).google;
      if (google?.accounts?.id) resolve(google);
      else reject(new Error('Google non disponibile'));
    };
    script.onerror = () => reject(new Error('Google non disponibile'));
    document.head.appendChild(script);
  }).catch(error => {
    identityPromise = null; // offline or blocked: try again next time
    throw error;
  });
  return identityPromise;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

function randomNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Draws Google's button in the container. Choosing an account signs in here (onSignedIn) or says why not (onError).
 * Rejects when Google's button cannot load: the caller then offers the redirect instead.
 */
export async function showGoogleButton(
  container: HTMLElement,
  onSignedIn: (account: Account) => void,
  onError: (error: Error) => void,
): Promise<void> {
  const google = await loadGoogleIdentity();
  // A fresh random value in every proof, so one cannot be reused: Google gets it hashed, Supabase checks it against this one
  const nonce = randomNonce();
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    nonce: await sha256Hex(nonce),
    ux_mode: 'popup',
    itp_support: true,
    callback: ({ credential }: GoogleCredential) => {
      void getClient()
        .then(client => client.auth.signInWithIdToken({ provider: 'google', token: credential, nonce }))
        .then(({ data, error }) => {
          if (error || !data.user) {
            // The Google account has no account here (sign-ups are closed: invite only)
            if (error && /signup|not allowed/i.test(`${error.code ?? ''} ${error.message}`)) throw new NotInvitedError();
            throw new Error('Accesso con Google non riuscito, riprova.');
          }
          onSignedIn(toAccount(data.user));
        })
        .catch((error: Error) =>
          onError(error instanceof NotInvitedError ? error : new Error('Accesso con Google non riuscito, riprova.')),
        );
    },
  });
  container.replaceChildren();
  google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    logo_alignment: 'center',
    locale: 'it',
    width: Math.max(200, Math.min(400, Math.floor(container.clientWidth))),
  });
}

/** The page we come back to after Google: the app itself */
const appUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

/** Leaves for Google's account chooser; the app reopens afterwards and finishGoogle() completes the sign-in */
export async function signInWithGoogle(): Promise<void> {
  const client = await getClient();
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: appUrl(), queryParams: { prompt: 'select_account' } },
  });
  if (error) throw explain(error);
}

/** Opened again by Google: the code to finish signing in, or why it did not work. Read once, when the app loads */
export const GOOGLE_RETURN: { code?: string; error?: string } | null = (() => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const code = params.get('code') ?? undefined;
  const error = params.get('error_description') ?? hash.get('error_description') ?? params.get('error') ?? hash.get('error') ?? undefined;
  if (!code && !error) return null;
  // Out of the address bar, so a reload does not try again
  window.history.replaceState(null, '', window.location.pathname);
  return { code, error };
})();

export async function finishGoogle(): Promise<Account> {
  if (!GOOGLE_RETURN) throw new Error('Accesso con Google non riuscito, riprova.');
  if (GOOGLE_RETURN.error || !GOOGLE_RETURN.code) {
    // The Google account has no account here (sign-ups are closed: invite only)
    if (/signup|not allowed|access_denied/i.test(GOOGLE_RETURN.error ?? '')) {
      throw new NotInvitedError();
    }
    throw new Error('Accesso con Google non riuscito, riprova.');
  }
  const client = await getClient();
  const { data, error } = await client.auth.exchangeCodeForSession(GOOGLE_RETURN.code);
  if (error || !data.user) throw new Error('Accesso con Google non riuscito, riprova.');
  return toAccount(data.user);
}

/**
 * Calls one of the server functions in supabase/functions (public: they check everything themselves). `errors` turns
 * the function's error codes into what to tell; `token` is the session, for the functions that need to know who you are.
 */
async function callFunction<T>(
  name: string,
  body: unknown,
  errors: Record<string, string> = { 'not-found': 'Richiesta non trovata o link non valido.' },
  token?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Non riesco a collegarmi: sei offline?');
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error((data.error && errors[data.error]) || 'Qualcosa è andato storto, riprova.');
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

const INVITE_ERRORS: Record<string, string> = {
  'not-found': 'Questo invito non esiste: controlla di aver aperto il link giusto.',
  used: "Questo invito è già stato usato: chiedine uno nuovo a chi te l'ha mandato.",
  expired: "Questo invito è scaduto: chiedine uno nuovo a chi te l'ha mandato.",
  email: 'Email non valida: controlla di averla scritta bene.',
  'too-many': 'Hai già 10 inviti in attesa: aspetta che qualcuno li usi o che scadano (dopo 7 giorni).',
  'signed-out': 'Per invitare devi essere dentro con il tuo account.',
};

/** A link for a friend: whoever opens it can join with their email. One person per link, valid 7 days */
export async function createInvite(): Promise<string> {
  const client = await getClient();
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error(INVITE_ERRORS['signed-out']);
  const { link } = await callFunction<{ link: string }>('invite', { action: 'create' }, INVITE_ERRORS, data.session.access_token);
  return link;
}

export interface InviteInfo {
  inviter: string | null;
  status: 'open' | 'used' | 'expired';
}

/** Who sent the invite, and whether it can still be used */
export function viewInvite(id: string, token: string): Promise<InviteInfo> {
  return callFunction<InviteInfo>('invite', { action: 'view', id, token }, INVITE_ERRORS);
}

/** Joins with the invite: 'sent' means the account is there and the code is on its way; 'exists', that the email already has one */
export async function acceptInvite(id: string, token: string, email: string): Promise<'sent' | 'exists'> {
  const { status } = await callFunction<{ status: 'sent' | 'exists' }>(
    'invite',
    { action: 'accept', id, token, email: email.trim() },
    INVITE_ERRORS,
  );
  return status;
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
      return check(
        await client.from('visits').select('mcdonald_id, visited_at, date_edited, verified, verified_at, rating, checkins'),
      ) as RemoteVisit[];
    },
    async upsertVisits(rows) {
      check(
        await client.from('visits').upsert(
          rows.map(r => ({ ...r, user_id: accountId })),
          { onConflict: 'user_id,mcdonald_id' },
        ),
      );
    },
    async deleteVisits(ids) {
      check(await client.from('visits').delete().eq('user_id', accountId).in('mcdonald_id', ids));
    },
    async listAchievements() {
      return check(await client.from('achievements').select('type, unlocked_at, value')) as RemoteAchievement[];
    },
    async addAchievements(rows) {
      check(
        await client.from('achievements').upsert(
          rows.map(r => ({ ...r, user_id: accountId })),
          { onConflict: 'user_id,type', ignoreDuplicates: true },
        ),
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
