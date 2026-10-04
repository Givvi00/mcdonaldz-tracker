// The invite a friend sent (…?invite=<id>&t=<secret>, see supabase/functions/invite): read once when the app opens and
// kept until it is used, so it survives a reload in the middle of the guide.

const KEY = 'mcdz-invite';

export interface InviteLink {
  id: string;
  token: string;
}

function read(): InviteLink | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('invite');
  const token = params.get('t');
  if (id && token) {
    // Out of the address bar, so it is not shared again by mistake
    window.history.replaceState(null, '', window.location.pathname);
    try {
      localStorage.setItem(KEY, JSON.stringify({ id, token }));
    } catch {
      // kept for this opening only
    }
    return { id, token };
  }
  try {
    const kept = JSON.parse(localStorage.getItem(KEY) ?? 'null') as InviteLink | null;
    return kept?.id && kept.token ? kept : null;
  } catch {
    return null;
  }
}

let pending = read();

export function pendingInvite(): InviteLink | null {
  return pending;
}

/** Used, or no longer good: forget it */
export function forgetInvite(): void {
  pending = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing kept
  }
}
