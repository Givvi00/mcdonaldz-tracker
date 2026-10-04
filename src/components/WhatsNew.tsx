import { useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { isOnboarded } from '@/services/onboarding';
import { APP_VERSION, markVersionSeen, readSeenVersion, unseenChanges, type ChangelogEntry } from '@/data/changelog';

// Worked out once when the app loads: whether this opening comes right after an update with something new to tell
const PENDING = unseenChanges(readSeenVersion(), isOnboarded());
if (PENDING.length === 0) markVersionSeen();

/** Whether the "what's new" popup is going to appear at this opening (the small "App aggiornata" banner then stays quiet) */
export const hasWhatsNew = () => PENDING.length > 0;

const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

/** The list of versions, newest first: shared by the popup and the Profile */
export function ChangelogSheet({ entries, title, onClose }: { entries: readonly ChangelogEntry[]; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2900] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl text-left border-t border-gray-200 bg-white px-5 pt-5 shadow-2xl animate-[toast-in_0.25s_ease-out] dark:border-gray-800 dark:bg-gray-900"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-mc-yellow text-2xl shadow-sm">✨</span>
          <div>
            <h3 className="font-display text-xl font-bold leading-tight text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Versione {APP_VERSION}</p>
          </div>
        </div>

        {entries.map((entry, i) => (
          <section key={entry.version} className="mt-5">
            {(entries.length > 1 || i > 0) && (
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Versione {entry.version} · {longDate(entry.date)}
              </p>
            )}
            <ul className="space-y-3">
              {entry.items.map(item => (
                <li key={item.text} className="flex gap-3">
                  <span className="w-7 flex-none text-center text-xl leading-6">{item.icon}</span>
                  <span className="text-sm leading-6 text-gray-700 dark:text-gray-200">{item.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-mc-red py-3 font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}

/** The popup after an update: what is new since the version you last saw. Waits until you are signed in and past the guide */
export function WhatsNew() {
  const onboarding = useMcdonaldStore(state => state.onboarding);
  const [open, setOpen] = useState(PENDING.length > 0);
  if (!open || onboarding !== 'done') return null;
  return (
    <ChangelogSheet
      entries={PENDING}
      title="Novità nell'app"
      onClose={() => {
        markVersionSeen();
        setOpen(false);
      }}
    />
  );
}
