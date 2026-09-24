import { useEffect, useState } from 'react';
import { reviewAccess, type AccessRequest } from '@/services/account';
import { FoodPattern } from '@/components/FoodPattern';

/** The request in the link from the owner's email (…?review=<id>&t=<secret>), if the app was opened from it */
export function reviewLink(): { id: string; token: string } | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('review');
  const token = params.get('t');
  return id && token ? { id, token } : null;
}

/**
 * Opened from the email "X vuole entrare in McDonaldz": shows who asks, and accepts or refuses. Works on any phone,
 * signed in or not: the secret in the link is the permission. Accepting creates the account and sends the person the
 * code to sign in.
 */
export function AccessReview({ id, token, onClose }: { id: string; token: string; onClose: () => void }) {
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    reviewAccess(id, token, 'view').then(setRequest, e => setError((e as Error).message));
  }, [id, token]);

  const answer = async (action: 'approve' | 'reject') => {
    setBusy(true);
    try {
      setRequest(await reviewAccess(id, token, action));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const who = request?.name || request?.email;

  return (
    <div
      role="dialog"
      aria-label="Richiesta di entrare"
      className="fixed inset-0 z-[3100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-mc-red to-red-800 px-8 text-center text-white"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <FoodPattern opacity={0.16} />
      <div className="relative w-full max-w-sm">
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          width={80}
          height={80}
          className="mx-auto rounded-[20px] border-4 border-white/80 shadow-2xl"
        />

        {!request && !error && <p className="mt-8 text-white/90">Carico la richiesta…</p>}
        {error && <p className="mt-8 rounded-2xl bg-white px-4 py-3 font-semibold text-red-700">{error}</p>}

        {request && (
          <>
            <h2 className="mt-6 font-display text-2xl font-bold">
              {request.status === 'pending' && `${who} vuole entrare`}
              {request.status === 'approved' && `${who} è dentro ✓`}
              {request.status === 'rejected' && `Richiesta di ${who} rifiutata`}
            </h2>
            {request.name && <p className="mt-2 text-white/80">{request.email}</p>}
            <p className="mt-1 text-sm text-white/60">
              Chiesto il {new Date(request.createdAt).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            {request.status === 'approved' && (
              <p className="mt-5 rounded-2xl bg-black/20 px-4 py-3 text-sm">
                {request.codeSent === false
                  ? 'Account creato. Il codice non è partito: digli di aprire l’app e chiederne uno.'
                  : 'Gli è arrivato il codice per entrare via email.'}
              </p>
            )}
            {request.status === 'pending' && (
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => void answer('reject')}
                  disabled={busy}
                  className="flex-1 rounded-2xl bg-white/15 py-3.5 font-bold active:scale-[0.98] disabled:opacity-50"
                >
                  Rifiuta
                </button>
                <button
                  onClick={() => void answer('approve')}
                  disabled={busy}
                  className="flex-[2] rounded-2xl bg-mc-yellow py-3.5 font-bold text-gray-800 shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {busy ? '…' : 'Accetta'}
                </button>
              </div>
            )}
          </>
        )}

        {request?.status === 'pending' ? (
          <button onClick={onClose} className="mt-4 text-sm font-semibold text-white/80 underline">
            Decidi dopo
          </button>
        ) : (
          (error || request) && (
            <button onClick={onClose} className="mt-8 w-full rounded-2xl bg-white/15 py-3.5 font-bold active:scale-[0.98]">
              Chiudi
            </button>
          )
        )}
      </div>
    </div>
  );
}
