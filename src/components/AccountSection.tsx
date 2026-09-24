import { useEffect, useRef, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { SectionTitle } from '@/components/SectionTitle';
import { ConfirmSheet } from '@/components/ConfirmSheet';

/**
 * Your account in the Profile: the email you sign in with, your username (unique among everyone), signing out and
 * deleting the account.
 * Saving online happens by itself and is never mentioned: there is nothing to do about it.
 */
export function AccountSection() {
  const { account, user, renameUser, signOut, deleteAccount, profileFocus, clearProfileFocus } = useMcdonaldStore();
  const [draft, setDraft] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'signout' | 'delete' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Arrived from "Ciao! Come ti chiami?": bring the field into view and start typing
  useEffect(() => {
    if (profileFocus !== 'name') return;
    const t = setTimeout(() => {
      input.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.current?.focus({ preventScroll: true });
      clearProfileFocus();
    }, 250);
    return () => clearTimeout(t);
  }, [profileFocus, clearProfileFocus]);

  const signedIn = account && account.status !== 'signed-out' ? account : null;
  const shown = draft ?? user?.name ?? '';
  const problem = nameError ?? (signedIn?.nameTaken ? `«${signedIn.nameTaken}» è già di un altro: scegline un altro` : null);

  const save = async () => {
    setSaving(true);
    try {
      await renameUser(shown);
      setDraft(null);
      setNameError(null);
    } catch (error) {
      setNameError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionTitle icon="cup">Il tuo account</SectionTitle>
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {signedIn && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Email</p>
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{signedIn.account.email}</p>
          </div>
        )}
        <div>
          <label htmlFor="username" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Username
          </label>
          <form
            className="mt-1 flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              void save();
            }}
          >
            <input
              id="username"
              ref={input}
              value={shown}
              onChange={e => {
                setDraft(e.target.value);
                setNameError(null);
              }}
              maxLength={16}
              placeholder="Il tuo username"
              className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-mc-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={draft === null || saving || !shown.trim()}
              className="rounded-xl bg-mc-red px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              {saving ? '…' : 'Salva'}
            </button>
          </form>
          {problem && (
            <p role="status" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {problem}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setActionError(null);
          setConfirm('signout');
        }}
        disabled={leaving}
        className="mt-3 w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-800 transition-transform active:scale-[0.98] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        {leaving ? 'Un momento…' : 'Esci'}
      </button>
      <button
        onClick={() => {
          setActionError(null);
          setConfirm('delete');
        }}
        className="mt-1 w-full py-2 text-center text-xs font-semibold text-red-600 underline dark:text-red-400"
      >
        Elimina account
      </button>
      {actionError && (
        <p role="status" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </p>
      )}

      {confirm === 'signout' && (
        <ConfirmSheet
          title="Uscire dall'account?"
          body="Da questo telefono spariscono visite e timbri, ma restano nel tuo account: rientrando con la tua email ritrovi tutto."
          confirmLabel="Esci"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            setLeaving(true);
            void signOut().catch(error => {
              setLeaving(false);
              setActionError((error as Error).message);
            });
          }}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmSheet
          title="Eliminare l'account?"
          body="Perdi tutto, per sempre: visite, voti, timbri, regioni e username, su ogni telefono. Non si può annullare."
          confirmLabel="Elimina account"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void deleteAccount().catch(error => setActionError((error as Error).message));
          }}
        />
      )}
    </div>
  );
}
