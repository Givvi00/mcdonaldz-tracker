import { useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { NotInvitedError, confirmCode, requestAccess, sendCode } from '@/services/account';

const INPUT = 'rounded-2xl border-2 border-white/40 bg-white px-4 py-3 text-base font-semibold text-gray-800 outline-none focus:border-mc-yellow';
const BUTTON = 'rounded-2xl bg-mc-yellow px-4 py-3 text-base font-bold text-gray-800 shadow-lg transition-transform active:scale-95 disabled:opacity-40';
const LINK = 'text-sm font-semibold text-white/80 underline';

type Step =
  /** Your email */
  | 'email'
  /** The email has no account yet: your name, to ask to join */
  | 'request'
  /** Asked: waiting for the owner to accept, then the code arrives */
  | 'waiting'
  /** The code was sent */
  | 'code';

/**
 * Signing in, on the red background of the guide: the email, then the code sent to it. An email with no account can
 * ask to join: the owner accepts from their email, and only then the code arrives. Each step says in its own words
 * what is happening and what comes next. Once in, the sync starts by itself.
 */
export function SignInForm({ onSignedIn }: { onSignedIn?: () => void }) {
  const { accountSignedIn } = useMcdonaldStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
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
      {step === 'email' && (
        <>
          <p className="mb-5 text-base leading-relaxed text-white/90">Scrivi la tua email: ti mandiamo un codice per entrare.</p>
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl font-bold text-white shadow-lg">✓</div>
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

      {error && <p role="status" className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
