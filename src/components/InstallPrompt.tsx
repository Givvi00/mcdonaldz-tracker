import { useState } from 'react';
import { useInstall } from '@/services/install';
import type { InstallHint } from '@/utils/install';
import { safariUrl } from '@/utils/platform';
import { SectionTitle } from '@/components/SectionTitle';

const DISMISS_KEY = 'mcdz-install-dismissed';
const DISMISS_FOR_DAYS = 14;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_FOR_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** Copies the app address so it can be pasted into Safari. */
function OpenInSafariButtons() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.origin + location.pathname);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const appUrl = location.origin + location.pathname;
  const safari = safariUrl(appUrl);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {safari && (
        <a
          href={safari}
          className="rounded-full bg-mc-red text-white text-sm font-bold px-5 py-2 active:scale-95 transition-transform"
        >
          Apri in Safari
        </a>
      )}
      <button
        onClick={copy}
        className="rounded-full border border-mc-red text-mc-red text-sm font-bold px-5 py-2 active:scale-95 transition-transform"
      >
        {copied ? '✓ Link copiato' : 'Copia link'}
      </button>
    </div>
  );
}

/** How to install, for each situation. */
function Instructions({ hint, onInstall }: { hint: InstallHint; onInstall: () => void }) {
  if (hint === 'prompt') {
    return (
      <>
        <p className="text-sm text-gray-600 dark:text-gray-300">Si apre a schermo intero, come un'app, e funziona anche senza rete.</p>
        <button
          onClick={onInstall}
          className="mt-3 rounded-full bg-mc-red text-white text-sm font-bold px-5 py-2 active:scale-95 transition-transform"
        >
          Installa
        </button>
      </>
    );
  }
  if (hint === 'ios') {
    return (
      <ol className="text-sm text-gray-600 dark:text-gray-300 list-decimal pl-5 space-y-1">
        <li>Tocca <strong>Condividi</strong> ⬆️ (in basso in Safari)</li>
        <li>Scegli <strong>«Aggiungi alla schermata Home»</strong></li>
        <li>Tocca <strong>«Aggiungi»</strong></li>
      </ol>
    );
  }
  if (hint === 'ios-other') {
    return (
      <>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Su iPhone l'installazione funziona da <strong>Safari</strong>, non da Chrome. Tocca <strong>«Apri in Safari»</strong> (se non succede nulla, copia il link e incollalo in Safari) e lì:
        </p>
        <ol className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-decimal pl-5 space-y-1">
          <li>Tocca <strong>Condividi</strong> ⬆️ (in basso)</li>
          <li>Scegli <strong>«Aggiungi alla schermata Home»</strong></li>
          <li>Tocca <strong>«Aggiungi»</strong></li>
        </ol>
        <OpenInSafariButtons />
      </>
    );
  }
  if (hint === 'android-manual') {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Apri il menu <strong>⋮</strong> del browser e scegli <strong>«Installa app»</strong> oppure <strong>«Aggiungi a schermata Home»</strong>.
      </p>
    );
  }
  if (hint === 'inapp') {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Per installarla apri questa pagina nel browser: tocca <strong>⋯</strong> e scegli <strong>«Apri nel browser»</strong> (Safari o Chrome).
      </p>
    );
  }
  return null;
}

/** Card on the Home screen, on phones only, until the app is installed or the user says "not now" (asked again after 14 days). */
export function InstallPrompt() {
  const { hint, mobile, promptInstall } = useInstall();
  const [dismissed, setDismissed] = useState(dismissedRecently);

  if (!mobile || dismissed || hint === 'none' || hint === 'installed') return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // storage blocked: hidden for this session only
    }
    setDismissed(true);
  };

  return (
    <section className="mx-4 rounded-2xl border border-mc-yellow bg-mc-yellow/20 dark:bg-mc-yellow/10 p-4 relative">
      <button
        onClick={dismiss}
        aria-label="Non ora"
        className="absolute top-2 right-2 w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 text-sm active:scale-95 transition-transform"
      >
        ✕
      </button>
      <h2 className="font-display font-semibold text-gray-800 dark:text-gray-100 mb-2 pr-8">📲 Installa McDonaldz sul telefono</h2>
      <Instructions hint={hint} onInstall={promptInstall} />
    </section>
  );
}

/** Profile section: always available, so someone who dismissed the card can still find the instructions. */
export function InstallSection() {
  const { hint, promptInstall } = useInstall();
  if (hint === 'none') return null;

  return (
    <div>
      <SectionTitle icon="chicken">Installa l'app</SectionTitle>
      <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
        {hint === 'installed' ? (
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ App installata su questo dispositivo</p>
        ) : (
          <Instructions hint={hint} onInstall={promptInstall} />
        )}
      </div>
    </div>
  );
}
