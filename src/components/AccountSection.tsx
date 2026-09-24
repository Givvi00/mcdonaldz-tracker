import { useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { SectionTitle } from '@/components/SectionTitle';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { confirmCode, sendCode } from '@/services/account';

const INPUT =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-mc-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

function syncLabel(at?: number): string {
  if (!at) return '';
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return 'Salvato online adesso';
  const time = new Date(at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const sameDay = new Date(at).toDateString() === new Date().toDateString();
  return `Salvato online ${sameDay ? `alle ${time}` : new Date(at).toLocaleDateString('it-IT', { dateStyle: 'medium' })}`;
}

/**
 * The online account in the Profile: sign in with a code sent by email; once in, the visits are saved online by
 * themselves and come back on any phone you sign in on.
 */
export function AccountSection() {
  const { account, accountSignedIn, syncNow, signOutAccount, deleteAccount } = useMcdonaldStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<'signout' | 'delete' | null>(null);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await work();
    } catch (error) {
      setMessage({ ok: false, text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const signedIn = account && account.status !== 'signed-out' ? account : null;

  return (
    <div>
      <SectionTitle emoji="☁️" className="mb-1">
        Salvataggio online
      </SectionTitle>

      {account === null && <p className="text-xs text-gray-500 dark:text-gray-400">Non raggiungibile adesso: sei offline?</p>}

      {account?.status === 'signed-out' && (
        <>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Entra con la tua email: visite, voti e timbri si salvano online da soli e li ritrovi su qualsiasi telefono. Per ora solo su
            invito.
          </p>
          {step === 'email' ? (
            <form
              className="flex gap-2"
              onSubmit={e => {
                e.preventDefault();
                void run(async () => {
                  await sendCode(email);
                  setStep('code');
                  setMessage({ ok: true, text: `Codice inviato a ${email.trim()}. Controlla anche lo spam.` });
                });
              }}
            >
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="La tua email"
                className={`${INPUT} min-w-0 flex-1`}
              />
              <button
                type="submit"
                disabled={busy || !email.includes('@')}
                className="rounded-xl bg-mc-red px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
              >
                {busy ? '…' : 'Invia codice'}
              </button>
            </form>
          ) : (
            <form
              className="space-y-2"
              onSubmit={e => {
                e.preventDefault();
                void run(async () => {
                  const signed = await confirmCode(email, code);
                  setCode('');
                  setStep('email');
                  await accountSignedIn(signed);
                  setMessage({ ok: true, text: 'Fatto: le tue visite ora sono salvate online' });
                });
              }}
            >
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Codice dall'email"
                  className={`${INPUT} min-w-0 flex-1 text-center tracking-[0.3em]`}
                />
                <button
                  type="submit"
                  disabled={busy || code.length < 6}
                  className="rounded-xl bg-mc-red px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
                >
                  {busy ? '…' : 'Entra'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setMessage(null);
                }}
                className="text-xs font-semibold text-gray-500 underline dark:text-gray-400"
              >
                Cambia email o richiedi un nuovo codice
              </button>
            </form>
          )}
        </>
      )}

      {signedIn && (
        <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{signedIn.account.email}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {signedIn.status === 'syncing' && 'Salvataggio in corso…'}
            {signedIn.status === 'synced' && (syncLabel(signedIn.lastSyncAt) || 'Collegato')}
            {signedIn.status === 'offline' && 'Sei offline: salvo online appena torna la connessione'}
            {signedIn.status === 'error' && 'Salvataggio online non riuscito: riprovo da solo, oppure tocca «Salva ora»'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void syncNow()}
              disabled={signedIn.status === 'syncing'}
              className="rounded-xl bg-mc-yellow px-3 py-2 text-xs font-bold text-gray-800 active:scale-95 disabled:opacity-50"
            >
              ☁️ Salva ora
            </button>
            <button
              onClick={() => setConfirm('signout')}
              className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-800 active:scale-95 dark:bg-gray-800 dark:text-gray-100"
            >
              Esci
            </button>
            <button onClick={() => setConfirm('delete')} className="px-2 py-2 text-xs font-semibold text-red-600 underline dark:text-red-400">
              Elimina account
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${
            message.ok ? 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {message.ok ? '✓ ' : ''}
          {message.text}
        </p>
      )}

      <p className="mt-2 text-[0.7rem] leading-snug text-gray-400 dark:text-gray-500">
        Online vanno solo email, nome, i Mc visitati con data, voti e timbri. La tua posizione resta sempre sul telefono.
      </p>

      {confirm === 'signout' && (
        <ConfirmSheet
          title="Uscire dall'account?"
          body="Le visite restano su questo telefono e online. Da qui non si salvano più online finché non rientri."
          confirmLabel="Esci"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void run(signOutAccount);
          }}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmSheet
          title="Eliminare l'account?"
          body="Si cancellano l'account e tutta la copia online: visite, voti, timbri e nome. Su questo telefono restano. Non si può annullare."
          confirmLabel="Elimina account"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void run(async () => {
              await deleteAccount();
              setMessage({ ok: true, text: 'Account eliminato. I dati su questo telefono sono ancora qui.' });
            });
          }}
        />
      )}
    </div>
  );
}
