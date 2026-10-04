import { useEffect, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import {
  GOOGLE_RETURN,
  NotInvitedError,
  confirmCode,
  finishGoogle,
  googleEnabled,
  requestAccess,
  sendCode,
  signInWithGoogle,
  signInWithPassword,
} from '@/services/account';

const INPUT =
  'rounded-2xl border-2 border-white/40 bg-white px-4 py-3 text-base font-semibold text-gray-800 outline-none focus:border-mc-yellow';
const BUTTON =
  'rounded-2xl bg-mc-yellow px-4 py-3 text-base font-bold text-gray-800 shadow-lg transition-transform active:scale-95 disabled:opacity-40';
const LINK = 'text-sm font-semibold text-white/80 underline';

type Step =
  /** Google, or your email */
  | 'email'
  /** Your email, with the password set in the Profile */
  | 'password'
  /** Back from Google: finishing */
  | 'google'
  /** The email has no account yet: your name, to ask to join */
  | 'request'
  /** Asked: waiting for the owner to accept, then the code arrives */
  | 'waiting'
  /** The code was sent */
  | 'code';

/**
 * Signing in, on the red background of the guide: with Google, or with the email and then the code sent to it (or the
 * password, for whoever set one in the Profile). An email with no account can
 * ask to join: the owner accepts from their email, and only then the code arrives. Each step says in its own words
 * what is happening and what comes next. Once in, the sync starts by itself.
 */
export function SignInForm({ onSignedIn }: { onSignedIn?: () => void }) {
  const { accountSignedIn } = useMcdonaldStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [google, setGoogle] = useState(false);
  const [step, setStep] = useState<Step>(GOOGLE_RETURN ? 'google' : 'email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownEmail = email.trim();

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void googleEnabled().then(setGoogle);
  }, []);

  // Opened again by Google: finish there, or say why not
  useEffect(() => {
    if (step !== 'google') return;
    finishGoogle()
      .then(async signed => {
        await accountSignedIn(signed);
        onSignedIn?.();
      })
      .catch(e => {
        setStep('email');
        setError(
          e instanceof NotInvitedError
            ? 'Questo account Google non è ancora dentro McDonaldz. Scrivi qui la tua email e chiedi di entrare.'
            : (e as Error).message,
        );
      });
    // once, on the way back
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = () => {
    setStep('email');
    setCode('');
    setError(null);
  };

  const sendTheCode = async () => {
    try {
      await sendCode(email);
      setStep('code');
    } catch (e) {
      if (!(e instanceof NotInvitedError)) throw e;
      setStep('request');
    }
  };

  const codeForm = (
    <form
      className="flex gap-2"
      onSubmit={e => {
        e.preventDefault();
        void run(async () => {
          const signed = await confirmCode(email, code);
          await accountSignedIn(signed);
          onSignedIn?.();
        });
      }}
    >
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
        placeholder="Codice"
        className={`${INPUT} min-w-0 flex-1 text-center tracking-[0.3em]`}
      />
      <button type="submit" disabled={busy || code.length < 6} className={BUTTON}>
        {busy ? '…' : 'Entra'}
      </button>
    </form>
  );

  return (
    <div className="w-full">
      {step === 'google' && <p className="py-6 text-base font-semibold text-white/90">Sto entrando con Google…</p>}

      {step === 'email' && (
        <>
          {google && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(signInWithGoogle)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-base font-bold text-gray-800 shadow-lg transition-transform active:scale-95 disabled:opacity-60"
              >
                <GoogleLogo />
                Accedi con Google
              </button>
              <div className="my-5 flex items-center gap-3 text-sm text-white/70">
                <span className="h-px flex-1 bg-white/30" />
                oppure con la tua email
                <span className="h-px flex-1 bg-white/30" />
              </div>
            </>
          )}
          <p className="mb-3 text-base leading-relaxed text-white/90">Scrivi la tua email: ti mandiamo un codice per entrare.</p>
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              void run(sendTheCode);
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
            <button type="submit" disabled={busy || !email.includes('@')} className={BUTTON}>
              {busy ? '…' : 'Avanti'}
            </button>
          </form>
          <button type="button" onClick={() => setStep('password')} className={`${LINK} mt-4`}>
            Ho una password
          </button>
        </>
      )}

      {step === 'password' && (
        <>
          <p className="mb-5 text-base leading-relaxed text-white/90">Entra con la tua email e la password che hai scelto nel profilo.</p>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              void run(async () => {
                const signed = await signInWithPassword(email, password);
                await accountSignedIn(signed);
                onSignedIn?.();
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
              className={`${INPUT} w-full`}
            />
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className={`${INPUT} w-full`}
            />
            <button type="submit" disabled={busy || !email.includes('@') || !password} className={`${BUTTON} w-full`}>
              {busy ? '…' : 'Entra'}
            </button>
          </form>
          <button type="button" onClick={restart} className={`${LINK} mt-4`}>
            Password dimenticata? Entra con il codice
          </button>
        </>
      )}

      {step === 'request' && (
        <>
          <p className="mb-1 text-base leading-relaxed text-white/90">
            <span className="font-semibold">{shownEmail}</span> non ha ancora un account.
          </p>
          <p className="mb-5 text-base leading-relaxed text-white/90">
            McDonaldz per ora è solo su invito: scrivi come ti chiami e chiedi di entrare.
          </p>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              void run(async () => {
                const result = await requestAccess(email, name);
                if (result === 'busy') throw new Error('Troppe richieste in attesa: riprova più tardi.');
                // Accepted in the meantime: straight to the code
                if (result === 'exists') await sendTheCode();
                else setStep('waiting');
              });
            }}
          >
            <input
              autoComplete="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              placeholder="Nome e cognome"
              className={`${INPUT} w-full`}
            />
            <button type="submit" disabled={busy || !name.trim()} className={`${BUTTON} w-full`}>
              {busy ? '…' : 'Chiedi di entrare'}
            </button>
          </form>
          <button type="button" onClick={restart} className={`${LINK} mt-4`}>
            Ho sbagliato email
          </button>
        </>
      )}

      {step === 'waiting' && (
        <>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl font-bold text-white shadow-lg">
            ✓
          </div>
          <p className="text-lg font-bold">Richiesta inviata</p>
          <p className="mt-2 mb-5 text-base leading-relaxed text-white/90">
            Appena viene accettata ti arriva un'email a <span className="font-semibold">{shownEmail}</span> con il codice: scrivilo qui. Se
            chiudi l'app, torna qui, scrivi la tua email e ti mandiamo un codice nuovo.
          </p>
          {codeForm}
          <button type="button" onClick={restart} className={`${LINK} mt-4`}>
            Ho sbagliato email
          </button>
        </>
      )}

      {step === 'code' && (
        <>
          <p className="mb-5 text-base leading-relaxed text-white/90">
            Ti abbiamo mandato un codice a <span className="font-semibold">{shownEmail}</span>. Scrivilo qui (se non lo trovi, guarda nello
            spam).
          </p>
          {codeForm}
          <button type="button" onClick={restart} className={`${LINK} mt-4`}>
            Cambia email o chiedi un codice nuovo
          </button>
        </>
      )}

      {error && (
        <p role="status" className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Google's "G", in its four colours */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
