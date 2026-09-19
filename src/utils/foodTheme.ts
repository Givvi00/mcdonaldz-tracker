import type { McDonald } from '@shared/types';

/** Food used for the decorations: burger, fries, drink, soft serve (McFlurry), chicken (nuggets), pie */
export const FOOD_EMOJI = ['🍔', '🍟', '🥤', '🍦', '🍗', '🥧'] as const;

// ---- Levels: ranks earned with the number of restaurants visited ----

export interface Level {
  min: number;
  name: string;
  icon: string;
}

export const LEVELS: readonly Level[] = [
  { min: 0, name: 'Assaggiatore', icon: '🥤' },
  { min: 5, name: 'Cliente abituale', icon: '🍟' },
  { min: 15, name: 'Divoratore di panini', icon: '🍔' },
  { min: 30, name: 'Esperto del Drive', icon: '🚗' },
  { min: 60, name: 'Maestro dei Mc', icon: '🎖️' },
  { min: 120, name: 'Leggenda dei Mc', icon: '🏆' },
  { min: 250, name: 'Re del Drive', icon: '👑' },
];

export interface LevelInfo {
  level: Level;
  /** Position in LEVELS, from 0 */
  index: number;
  /** Level number as shown to people, from 1 */
  number: number;
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
  return { level: LEVELS[index], index, number: index + 1, next, toNext: next ? next.min - count : 0 };
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
