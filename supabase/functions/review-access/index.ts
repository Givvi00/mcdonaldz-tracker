// The owner's answer to a request to join (from the link in the email, opened in the app: see AccessReview.tsx).
// The secret in the link is the only key: checked against its hash, valid for that request only, and only while open.
//
// POST { id, token, action: 'view' | 'approve' | 'reject' }
//   view    → { email, name, status, createdAt }
//   approve → creates the account and sends the person the code to sign in → { status: 'approved' }
//   reject  → { status: 'rejected' }
import { CORS, adminClient, json, publicClient, sha256 } from '../_shared/common.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body: { id?: unknown; token?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'body' }, 400);
  }
  const { id, token, action } = body;
  if (typeof id !== 'string' || typeof token !== 'string' || !['view', 'approve', 'reject'].includes(action as string)) {
    return json({ error: 'body' }, 400);
  }

  const admin = adminClient();
  const { data: request } = await admin
    .from('access_requests')
    .select('id, email, name, status, created_at, token_hash')
    .eq('id', id)
    .maybeSingle();
  // The same answer for a wrong id and a wrong secret: nothing to learn by trying
  if (!request || request.token_hash !== (await sha256(token))) return json({ error: 'not-found' }, 404);

  const summary = { email: request.email, name: request.name, status: request.status, createdAt: request.created_at };
  if (action === 'view' || request.status !== 'pending') return json(summary);

  if (action === 'reject') {
    await admin.from('access_requests').update({ status: 'rejected', decided_at: new Date().toISOString() }).eq('id', id);
    return json({ ...summary, status: 'rejected' });
  }

  // Approve: the account (confirmed, it signs in with codes only), then the code, sent the same way the app sends it
  const { error: createError } = await admin.auth.admin.createUser({ email: request.email, email_confirm: true });
  if (createError && !/already|registered|exists/i.test(createError.message)) {
    console.error('createUser', createError.message);
    return json({ error: 'server' }, 500);
  }
  await admin.from('access_requests').update({ status: 'approved', decided_at: new Date().toISOString() }).eq('id', id);
  const { error: codeError } = await publicClient().auth.signInWithOtp({ email: request.email, options: { shouldCreateUser: false } });
  // The account is there anyway: if the code did not leave, the person asks for one from the app
  return json({ ...summary, status: 'approved', codeSent: !codeError });
});
