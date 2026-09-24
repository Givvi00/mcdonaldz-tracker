// Shared by the server functions (Deno, run by Supabase). SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase; the service key stays here, it never reaches the app.
import { createClient } from 'npm:@supabase/supabase-js@2';

/** The app is on GitHub Pages: its requests come from another origin */
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`missing secret ${name}`);
  return value;
}

/** With the service key: can see the requests and create accounts */
export function adminClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

/** With the public key, as the app: used to send the sign-in code, exactly like the app does */
export function publicClient() {
  // The public key is public by design (the app carries it); the fallback covers projects without the legacy one
  const key = Deno.env.get('SUPABASE_ANON_KEY') ?? 'sb_publishable_H-jhJDdrTnyGjSAQTsadNA_LohmE4FN';
  return createClient(env('SUPABASE_URL'), key, { auth: { persistSession: false } });
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
