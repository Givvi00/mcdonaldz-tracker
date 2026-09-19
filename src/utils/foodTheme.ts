import type { McDonald } from '@shared/types';

/** The hand-drawn food icons (drawings in components/foodSprite.ts): used for the pattern, the food shower and the map markers */
export const FOOD_ICONS = [
  'burger',
  'bigmac',
  'chicken',
  'toast',
  'filet',
  'wrap',
  'fries',
  'nuggets',
  'wings',
  'basket',
  'cup',
  'mcflurry',
  'happy',
] as const;
export type FoodIconName = (typeof FOOD_ICONS)[number];

/** Markup of one icon, for places that build HTML by hand (the map). Needs the sprite in the page (FoodIconSprite). */
export function foodIconSvg(name: FoodIconName, size: number): string {
  return `<svg class="food-ico" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><use href="#food-${name}"/></svg>`;
}

// ---- Levels: ranks earned with the number of restaurants visited ----

export interface Level {
  min: number;
  name: string;
  icon: FoodIconName;
}

export const LEVELS: readonly Level[] = [
  { min: 0, name: 'Solo un assaggio', icon: 'cup' },
  { min: 5, name: 'Cliente abituale', icon: 'fries' },
  { min: 15, name: 'Divoratore di panini', icon: 'burger' },
  { min: 30, name: 'Re dei nuggets', icon: 'nuggets' },
  { min: 50, name: 'Maniaco del McFlurry', icon: 'mcflurry' },
  { min: 80, name: 'Happy Meal a 30 anni', icon: 'happy' },
  { min: 120, name: 'Ali e nuggets, sempre', icon: 'wings' },
  { min: 180, name: 'Big Mac di fiducia', icon: 'bigmac' },
  { min: 260, name: 'Ospite fisso al Drive', icon: 'basket' },
  { min: 380, name: 'Il cassiere sa già cosa vuoi', icon: 'filet' },
  { min: 550, name: 'Mezza Italia in panini', icon: 'wrap' },
  { min: 800, name: 'Leggenda del Drive', icon: 'toast' },
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

// ---- Map marker: a stable food icon for each restaurant ----

/** Same restaurant, same icon, every time (a simple hash of the id) */
export function markerIcon(id: string): FoodIconName {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FOOD_ICONS[hash % FOOD_ICONS.length];
}
