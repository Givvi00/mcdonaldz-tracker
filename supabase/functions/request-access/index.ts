// Someone not invited asks to join: the request is kept and the owner gets an email with a link to accept or refuse
// it (the link opens the app, see AccessReview.tsx, which calls review-access).
// Public (no sign-in: whoever asks has no account yet). Against abuse: one open request per email, few open at once.
//
// POST { email, name } → { status: 'sent' | 'pending' | 'exists' | 'busy' }
// Secrets: RESEND_API_KEY, OWNER_EMAIL, APP_URL
import { CORS, EMAIL_RE, adminClient, env, escapeHtml, json, randomToken, sha256 } from '../_shared/common.ts';

/** More open requests than this and nobody else can ask until the owner looks at them */
const MAX_PENDING = 20;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body: { email?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'body' }, 400);
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : '';
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'email' }, 400);
  if (!name) return json({ error: 'name' }, 400);

  const admin = adminClient();

  const { data: exists, error: existsError } = await admin.rpc('account_exists', { candidate: email });
  if (existsError) return json({ error: 'server' }, 500);
  if (exists) return json({ status: 'exists' });

  const { data: open, error: openError } = await admin.from('access_requests').select('email').eq('status', 'pending');
  if (openError) return json({ error: 'server' }, 500);
  if (open.some(r => r.email.toLowerCase() === email)) return json({ status: 'pending' });
  if (open.length >= MAX_PENDING) return json({ status: 'busy' });

  const token = randomToken();
  const { data: created, error: insertError } = await admin
    .from('access_requests')
    .insert({ email, name, token_hash: await sha256(token) })
    .select('id')
    .single();
  // A request for the same email arriving at the same moment: the unique index keeps just one
  if (insertError) return insertError.code === '23505' ? json({ status: 'pending' }) : json({ error: 'server' }, 500);

  const link = `${env('APP_URL')}?review=${created.id}&t=${token}`;
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'McDonaldz <onboarding@resend.dev>',
      to: [env('OWNER_EMAIL')],
      subject: `${name} vuole entrare in McDonaldz`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:420px">
          <h2 style="margin:0 0 8px">🍔 Nuova richiesta</h2>
          <p style="margin:0 0 4px"><b>${escapeHtml(name)}</b></p>
          <p style="margin:0 0 20px;color:#555">${escapeHtml(email)}</p>
          <a href="${link}" style="display:inline-block;background:#DA291C;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">
            Accetta o rifiuta
          </a>
          <p style="margin:20px 0 0;color:#888;font-size:12px">Il link vale solo per questa richiesta.</p>
        </div>`,
    }),
  });
  if (!sent.ok) {
    // Without the email the owner would never know: drop the request, so the person can try again
    await admin.from('access_requests').delete().eq('id', created.id);
    console.error('resend', sent.status, await sent.text());
    return json({ error: 'email-failed' }, 502);
  }
  return json({ status: 'sent' });
});
