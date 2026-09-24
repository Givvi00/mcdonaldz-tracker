// What changed on this phone and still has to reach the online copy (see sync.ts). Kept in localStorage, so it
// survives a closed app or a missing connection: the next sync sends it.
//
// Each entry is a counter, bumped at every change. A sync remembers the counters it sent and clears only the entries
// still at that value: a change made while the sync was running stays marked, and goes out with the next one.

const KEY = 'mcdz-sync-dirty';
/** The entry for the name (restaurant ids never look like this) */
export const NAME_ENTRY = '#name';

export type Outbox = Record<string, number>;

export function readOutbox(): Outbox {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Outbox) : {};
  } catch {
    return {};
  }
}

function writeOutbox(outbox: Outbox): void {
  try {
    if (Object.keys(outbox).length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(outbox));
  } catch {
    // storage unavailable: the next full sync (first one of an account on a phone) sends everything anyway
  }
}

const listeners = new Set<() => void>();

/** Called after every change marked (the account code uses it to send changes shortly after they happen) */
export function onOutboxChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markChanged(entry: string): void {
  const outbox = readOutbox();
  outbox[entry] = (outbox[entry] ?? 0) + 1;
  writeOutbox(outbox);
  listeners.forEach(listener => listener());
}

/**
 * Wraps a local write of one restaurant's visit: marked before (so a sync running in the meantime never overwrites it
 * with the online copy) and again after (so a sync that read the old value sends it again next time).
 */
export async function changing<T>(entry: string, write: () => Promise<T>): Promise<T> {
  markChanged(entry);
  try {
    return await write();
  } finally {
    markChanged(entry);
  }
}

/** Clears the entries that were sent, unless they changed again while sending */
export function clearSent(sent: Outbox): void {
  const outbox = readOutbox();
  for (const [entry, count] of Object.entries(sent)) {
    if (outbox[entry] === count) delete outbox[entry];
  }
  writeOutbox(outbox);
}
