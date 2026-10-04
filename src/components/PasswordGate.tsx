import { useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { setPassword } from '@/services/account';
import { FoodPattern } from '@/components/FoodPattern';

/**
 * Signed in without a password (with the code sent by email): the app asks for one before going on, once. From then on
 * you sign in with email and password; the code stays only for the first time and for a forgotten password.
 * Not shown offline (it could not be saved): it comes back with the connection.
 */
export function PasswordGate() {
  const { account, onboarding, passwordChosen } = useMcdonaldStore();
  const [value, setValue] = useState('');
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = account && account.status !== 'signed-out' ? account.account : null;
  if (!signedIn || signedIn.hasPassword !== false || onboarding !== 'done' || account?.status === 'offline') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scegli una password"
      className="fixed inset-0 z-[3050] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-mc-red to-red-800 px-6 text-center text-white"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <FoodPattern />
      <div className="relative w-full max-w-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-5xl shadow-xl">🔒</div>
        <h2 className="font-display text-2xl font-bold">Scegli una password</h2>
        <p className="mt-2 mb-6 text-base leading-relaxed text-white/90">
          Da ora entri con <span className="font-semibold">{signedIn.email}</span> e la tua password, senza aspettare il codice.
        </p>
        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            setPassword(value)
              .then(passwordChosen)
              .catch(err => setError((err as Error).message))
              .finally(() => setBusy(false));
          }}
        >
          <div className="relative">
            <input
              type={shown ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              required
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Almeno 8 caratteri"
              className="w-full rounded-2xl border-2 border-white/40 bg-white px-4 py-3 pr-20 text-base font-semibold text-gray-800 outline-none focus:border-mc-yellow"
            />
            <button
              type="button"
              onClick={() => setShown(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500"
            >
              {shown ? 'Nascondi' : 'Mostra'}
            </button>
          </div>
          <button
            type="submit"
            disabled={busy || value.length < 8}
            className="w-full rounded-2xl bg-mc-yellow px-4 py-3 text-base font-bold text-gray-800 shadow-lg transition-transform active:scale-95 disabled:opacity-40"
          >
            {busy ? '…' : 'Salva e continua'}
          </button>
        </form>
        {error && <p role="status" className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </div>
    </div>
  );
}
