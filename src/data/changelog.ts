// What is new in each version, as the people using the app read it: in the popup after an update and in the Profile.
// Newest first. Every update that changes something people can see gets a new version here (and the same number in
// package.json: scripts/test-changelog.ts checks it). Only what matters to them, in a few words: no technical details.
// Updates with only fixes under the hood keep the version and show nothing.

export interface ChangelogEntry {
  version: string;
  /** YYYY-MM-DD */
  date: string;
  items: Array<{ icon: string; text: string }>;
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: '1.1',
    date: '2026-10-04',
    items: [
      {
        icon: '🔁',
        text: "Contatore delle visite: se apri l'app in un Mc dove sei già stato, conta da solo un'altra visita (al massimo una ogni 4 ore). Lo vedi sulla card del ristorante e in Stats.",
      },
      { icon: '🔒', text: 'Nel profilo puoi scegliere una password: poi entri con email e password, senza aspettare il codice.' },
    ],
  },
  {
    version: '1.0',
    date: '2026-10-03',
    items: [
      { icon: '🍟', text: 'Benvenuto in McDonaldz! Segna i Mc che visiti, sblocca timbri e completa le regioni.' },
      { icon: '👥', text: 'Nella voce Amici trovi la classifica con i tuoi amici.' },
    ],
  },
];

export const APP_VERSION = CHANGELOG[0].version;

const SEEN_KEY = 'mcdz-seen-version';

/** Compares "1.10" and "1.9" as numbers, part by part */
export function newerThan(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/**
 * The versions to tell about at this opening (newest first), or none: every version between the one you had and this one, however many were skipped.
 * A brand-new install hears nothing (the guide explains the app). Someone who already used the app before versions were
 * counted hears about the current one.
 */
export function unseenChanges(seen: string | null, alreadyUsing: boolean): ChangelogEntry[] {
  if (seen === null) return alreadyUsing ? CHANGELOG.slice(0, 1) : [];
  return CHANGELOG.filter(e => newerThan(e.version, seen));
}

export function readSeenVersion(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return APP_VERSION; // storage unavailable: better not to show the popup at every opening
  }
}

export function markVersionSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, APP_VERSION);
  } catch {
    // nothing to remember
  }
}
