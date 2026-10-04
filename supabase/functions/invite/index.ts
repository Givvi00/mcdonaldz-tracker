// Invites: someone in the app makes a link for a friend (create); the friend opens it in the app, sees who invited
// them (view) and writes their email (accept): the account is created and the sign-in code leaves at once, no owner
// needed. The secret in the link is the only key: checked against its hash, one person per link, valid 7 days.
//
// POST { action: 'create' }                       (signed in: Authorization: Bearer <session token>) → { link }
// POST { action: 'view', id, token }              → { inviter, status: 'open' | 'used' | 'expired' }
// POST { action: 'accept', id, token, email }     → { status: 'sent' | 'exists', codeSent? }
// Secrets: APP_URL
import { CORS, EMAIL_RE, adminClient, env, json, publicClient, randomToken, sha256 } from '../_shared/common.ts';

/** Links not used yet (and not expired) that one person can have at once */
const MAX_OPEN = 10;

type Admin = ReturnType<typeof adminClient>;

async function inviterName(admin: Admin, userId: string): Promise<string | null> {
  const { data } = await admin.from('profiles').select('name').eq('id', userId).maybeSingle();
  return data?.name ?? null;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body: { action?: unknown; id?: unknown; token?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'body' }, 400);
  }
  const admin = adminClient();

  if (body.action === 'create') {
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth } = jwt ? await admin.auth.getUser(jwt) : { data: { user: null } };
    if (!auth.user) return json({ error: 'signed-out' }, 401);

    const { count, error: countError } = await admin
      .from('invites')
      .select('id', { count: 'exact', head: true })
      .eq('inviter', auth.user.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());
    if (countError) {
      console.error('invites count', countError.message);
      return json({ error: 'server' }, 500);
    }
    if ((count ?? 0) >= MAX_OPEN) return json({ error: 'too-many' }, 429);

    const token = randomToken();
    const { data: created, error } = await admin
      .from('invites')
      .insert({ inviter: auth.user.id, token_hash: await sha256(token) })
      .select('id')
      .single();
    if (error) {
      console.error('invites insert', error.message);
      return json({ error: 'server' }, 500);
    }
    return json({ link: `${env('APP_URL')}?invite=${created.id}&t=${token}` });
  }

  if (body.action !== 'view' && body.action !== 'accept') return json({ error: 'body' }, 400);
  const { id, token } = body;
  if (typeof id !== 'string' || typeof token !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'not-found' }, 404);

  const { data: invite } = await admin.from('invites').select('id, inviter, token_hash, expires_at, used_at').eq('id', id).maybeSingle();
  // The same answer for a wrong id and a wrong secret: nothing to learn by trying
  if (!invite || invite.token_hash !== (await sha256(token))) return json({ error: 'not-found' }, 404);
  const status = invite.used_at ? 'used' : new Date(invite.expires_at) < new Date() ? 'expired' : 'open';

  if (body.action === 'view') return json({ inviter: await inviterName(admin, invite.inviter), status });
  if (status !== 'open') return json({ error: status }, 410);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'email' }, 400);

  // Already in: nothing to create, the link stays for someone else
  const { data: exists, error: existsError } = await admin.rpc('account_exists', { candidate: email });
  if (existsError) {
    console.error('account_exists', existsError.message);
    return json({ error: 'server' }, 500);
  }
  if (exists) return json({ status: 'exists' });

  // Claim the link first, so two people opening it at the same moment cannot both get in
  const { data: claimed } = await admin
    .from('invites')
    .update({ used_at: new Date().toISOString(), used_email: email })
    .eq('id', id)
    .is('used_at', null)
    .select('id');
  if (!claimed?.length) return json({ error: 'used' }, 410);

  const { error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (createError && !/already|registered|exists/i.test(createError.message)) {
    console.error('createUser', createError.message);
    await admin.from('invites').update({ used_at: null, used_email: null }).eq('id', id);
    return json({ error: 'server' }, 500);
  }
  // The code, sent the same way the app sends it; if it did not leave, the person asks for one from the app
  const { error: codeError } = await publicClient().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  return json({ status: 'sent', codeSent: !codeError });
});
