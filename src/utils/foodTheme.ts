import type { McDonald } from '@shared/types';

/** Food used for the decorations: burger, fries, drink, soft serve (McFlurry), chicken (nuggets), pie */
export const FOOD_EMOJI = ['🍔', '🍟', '🥤', '🍦', '🍗', '🥧'] as const;

// ---- Levels: named after the menu, from the number of restaurants visited ----

export interface Level {
  min: number;
  name: string;
  icon: string;
}

export const LEVELS: readonly Level[] = [
  { min: 0, name: 'Happy Meal', icon: '🧸' },
  { min: 5, name: 'Cheeseburger', icon: '🍔' },
  { min: 15, name: 'Menu Medium', icon: '🍟' },
  { min: 30, name: 'Big Mac', icon: '🍔' },
  { min: 60, name: 'Maxi Menu', icon: '🥤' },
  { min: 120, name: 'Party Box', icon: '🎉' },
  { min: 250, name: 'Re del Drive', icon: '👑' },
];

export interface LevelInfo {
  level: Level;
  /** Position in LEVELS, from 0 */
  index: number;
  next: Level | null;
  /** Visits still needed for the next level (0 at the top level) */
  toNext: number;
}

export function levelInfo(visited: number): LevelInfo {
  const count = Math.max(0, Math.floor(visited));
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (count >= LEVELS[i].min) index = i;
  }
  const next = LEVELS[index + 1] ?? null;
  return { level: LEVELS[index], index, next, toNext: next ? next.min - count : 0 };
}

// ---- Tray: fills up with food as the visits grow ----

export interface TraySlot {
  emoji: string;
  label: string;
  /** Visits needed to put it on the tray */
  min: number;
}

export const TRAY_SLOTS: readonly TraySlot[] = [
  { emoji: '🥤', label: 'Bibita', min: 1 },
  { emoji: '🍟', label: 'Patatine', min: 5 },
  { emoji: '🍔', label: 'Panino', min: 15 },
  { emoji: '🍗', label: 'Nuggets', min: 30 },
  { emoji: '🍦', label: 'McFlurry', min: 60 },
  { emoji: '🥧', label: 'Dolcetto', min: 120 },
];

export function trayFilled(visited: number): boolean[] {
  return TRAY_SLOTS.map(slot => visited >= slot.min);
}

// ---- Restaurant kind, read from the name and address in the data ----

export interface RestaurantKind {
  emoji: string;
  label: string;
}

const KIND_RULES: Array<{ kind: RestaurantKind; test: RegExp }> = [
  { kind: { emoji: '✈️', label: 'Aeroporto' }, test: /aeroporto|airport|malpensa|linate|caselle|orio al serio/i },
  { kind: { emoji: '🚉', label: 'Stazione' }, test: /stazione|termini|centrale|porta susa|porta nuova|porta garibaldi|brignole|principe|\bFSI?\b/i },
  { kind: { emoji: '⛽', label: 'Area di servizio' }, test: /area di servizio|\bAdS\b|autostrada|uscita [a-z]?\d|agip|tamoil|total-erg|\(eni\)/i },
  { kind: { emoji: '🚗', label: 'Drive' }, test: /drive/i },
  { kind: { emoji: '🛍️', label: 'Centro commerciale' }, test: /mall|outlet|retail park|centro comm|\bc\.?c\.?\s|village|galleria|maximall|vulcano/i },
];

/** Special kinds only (airport, station, service area, drive, mall); an ordinary restaurant has none */
export function restaurantKind(mc: Pick<McDonald, 'name' | 'address'>): RestaurantKind | null {
  const text = `${mc.name} ${mc.address}`;
  return KIND_RULES.find(rule => rule.test.test(text))?.kind ?? null;
}

// ---- Map marker: a stable food emoji for each restaurant ----

/** Same restaurant, same emoji, every time (a simple hash of the id) */
export function markerEmoji(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FOOD_EMOJI[hash % FOOD_EMOJI.length];
}
