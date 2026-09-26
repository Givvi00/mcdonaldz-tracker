// What you earned and have not looked at yet: stamps (their id), regions completed ("REGION:<name>") and diamond ones
// ("DIAMOND:<name>"). They make the dot on Stats; opening them clears them. Kept on this phone: what arrives from
// another phone was already seen there.

const KEY = 'mcdz-unseen';

export function readUnseen(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeUnseen(types: string[]): void {
  try {
    if (types.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(types));
  } catch {
    // storage unavailable: the dot lasts until the app is closed
  }
}

/** Adds the new ones at the end, without doubles */
export function withUnseen(current: string[], added: string[]): string[] {
  return [...current, ...added.filter(t => !current.includes(t))];
}
