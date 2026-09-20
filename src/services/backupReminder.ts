// When the last backup was made (kept in this browser only), and whether it is time to remind about it.
const KEY = 'mcdz-last-backup';
const REMIND_AFTER_DAYS = 30;
const MIN_VISITS_FOR_REMINDER = 3;

export function lastBackupAt(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function markBackupDone(now: number = Date.now()): void {
  try {
    localStorage.setItem(KEY, String(now));
  } catch {
    // no storage: the reminder simply keeps showing
  }
}

/** Remind once there is something worth protecting and the last backup is missing or old */
export function backupNudge(visits: number, now: number = Date.now()): boolean {
  if (visits < MIN_VISITS_FOR_REMINDER) return false;
  const last = lastBackupAt();
  return last === null || now - last > REMIND_AFTER_DAYS * 24 * 60 * 60 * 1000;
}
