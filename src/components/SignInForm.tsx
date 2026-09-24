import { useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { NotInvitedError, confirmCode, requestAccess, sendCode } from '@/services/account';

const STYLES = {
  /** In the Profile */
  card: {
    input:
      'rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-mc-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
    button: 'rounded-xl bg-mc-red px-4 py-2.5 text-sm font-bold text-white',
    link: 'text-xs font-semibold text-gray-500 underline dark:text-gray-400',
    ok: 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300',
    bad: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  /** On the red background of the guide */
  onRed: {
    input: 'rounded-2xl border-2 border-white/40 bg-white px-4 py-3 text-base font-semibold text-gray-800 outline-none focus:border-mc-yellow',
    button: 'rounded-2xl bg-mc-yellow px-4 py-3 text-base font-bold text-gray-800 shadow-lg',
    link: 'text-sm font-semibold text-white/80 underline',
    ok: 'bg-black/20 text-white',
    bad: 'bg-white text-red-700',
  },
};

/**
 * Sign in with a code sent by email: the email, then the code. Once in, the sync starts by itself (visits, votes,
 * stamps and username from other phones arrive). An email with no account can ask to join: the owner accepts from
 * their email, and the code then arrives by itself.
 */
export function SignInForm({ variant = 'card', onSignedIn }: { variant?: keyof typeof STYLES; onSignedIn?: () => void }) {
  const { accountSignedIn } = useMcdonaldStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'request' | 'code'>('email');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const style = STYLES[variant];

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

  return (
    <div className="w-full">
      {step === 'email' ? (
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            void run(async () => {
              try {
                await sendCode(email);
              } catch (error) {
                if (error instanceof NotInvitedError) {
                  setStep('request');
                  return;
                }
                throw error;
              }
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
            className={`${style.input} min-w-0 flex-1`}
          />
          <button type="submit" disabled={busy || !email.includes('@')} className={`${style.button} transition-transform active:scale-95 disabled:opacity-40`}>
            {busy ? '…' : 'Invia codice'}
          </button>
        </form>
      ) : step === 'request' ? (
        <form
          className="space-y-2"
          onSubmit={e => {
            e.preventDefault();
            void run(async () => {
              const result = await requestAccess(email, name);
              if (result === 'exists') {
                // Accepted in the meantime: just sign in
                await sendCode(email);
                setStep('code');
                setMessage({ ok: true, text: `Codice inviato a ${email.trim()}. Controlla anche lo spam.` });
                return;
              }
              if (result === 'busy') throw new Error('Troppe richieste in attesa: riprova più tardi.');
              setStep('code');
              setMessage({
                ok: true,
                text:
                  result === 'pending'
                    ? 'Hai già chiesto di entrare: appena la richiesta viene accettata ti arriva il codice via email.'
                    : 'Richiesta inviata! Appena viene accettata ti arriva il codice via email: scrivilo qui.',
              });
            });
          }}
        >
          <p className={`rounded-xl px-3 py-2 text-sm ${style.ok}`}>
            <span className="font-semibold">{email.trim()}</span> non è ancora dentro. Chiedi di entrare: dicci come ti chiami.
          </p>
          <div className="flex gap-2">
            <input
              autoComplete="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              placeholder="Nome e cognome"
              className={`${style.input} min-w-0 flex-1`}
            />
            <button type="submit" disabled={busy || !name.trim()} className={`${style.button} transition-transform active:scale-95 disabled:opacity-40`}>
              {busy ? '…' : 'Chiedi di entrare'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setMessage(null);
            }}
            className={style.link}
          >
            Cambia email
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
              onSignedIn?.();
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
              className={`${style.input} min-w-0 flex-1 text-center tracking-[0.3em]`}
            />
            <button type="submit" disabled={busy || code.length < 6} className={`${style.button} transition-transform active:scale-95 disabled:opacity-40`}>
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
            className={style.link}
          >
            Cambia email o richiedi un nuovo codice
          </button>
        </form>
      )}
      {message && (
        <p role="status" className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${message.ok ? style.ok : style.bad}`}>
          {message.ok ? '✓ ' : ''}
          {message.text}
        </p>
      )}
    </div>
  );
}
