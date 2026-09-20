import { FOOD_ICONS, type FoodIconName } from '@/utils/foodTheme';

// Lattice of icons for the red cards: columns shifted up and down alternately. The tile repeats sideways (the pattern
// slides) and vertically, so distances are measured with wrap-around.
export const ICON = 34;
export const COLS = 14;
export const COL_PITCH = 52;
export const ROW_PITCH = 62;
export const TILE_W = COLS * COL_PITCH;
export const TILE_H = 2 * ROW_PITCH;
/** Same icon never closer than this (pixels), so no lookalikes sit next to each other */
export const MIN_SAME_DISTANCE = 200;

export interface Slot {
  key: string;
  name: FoodIconName;
  x: number;
  y: number;
}

/** Small seeded generator: the same "random" layout on every load, so the background does not jump around */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distance between two points on the repeating tile (the closest copy counts) */
export function wrappedDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  let dx = Math.abs(a.x - b.x) % TILE_W;
  let dy = Math.abs(a.y - b.y) % TILE_H;
  dx = Math.min(dx, TILE_W - dx);
  dy = Math.min(dy, TILE_H - dy);
  return Math.hypot(dx, dy);
}

/** Where the icons of one tile go, and which icon each one is: random, but with the same icon always far apart */
export function patternSlots(seed = 20260920): Array<{ name: FoodIconName; x: number; y: number; key: string }> {
  const random = seeded(seed);
  const positions: Array<{ x: number; y: number; key: string }> = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < 2; r++) {
      positions.push({
        key: `${c}-${r}`,
        x: c * COL_PITCH + (COL_PITCH - ICON) / 2,
        y: r * ROW_PITCH + (c % 2) * (ROW_PITCH / 2) + 8,
      });
    }
  }

  // Visit the slots in random order so the constraint does not favour the left side
  const order = positions.map((_, i) => i).sort(() => random() - 0.5);
  const chosen = new Map<number, FoodIconName>();
  const used = new Map<FoodIconName, number>(FOOD_ICONS.map(n => [n, 0]));

  for (const index of order) {
    const p = positions[index];
    const scored = FOOD_ICONS.map(name => {
      let nearest = Infinity;
      for (const [other, otherName] of chosen) {
        if (otherName === name) nearest = Math.min(nearest, wrappedDistance(p, positions[other]));
      }
      return { name, nearest, count: used.get(name) ?? 0 };
    });
    const ok = scored.filter(s => s.nearest >= MIN_SAME_DISTANCE);
    // Prefer the least used icons among the allowed ones; if none is allowed, the one that is farthest away
    let pool = ok;
    if (pool.length === 0) {
      const farthest = Math.max(...scored.map(s => s.nearest));
      pool = scored.filter(s => s.nearest === farthest);
    }
    const fewest = Math.min(...pool.map(s => s.count));
    const candidates = pool.filter(s => s.count === fewest);
    const pick = candidates[Math.floor(random() * candidates.length)];
    chosen.set(index, pick.name);
    used.set(pick.name, pick.count + 1);
  }

  return positions.map((p, i) => ({ ...p, name: chosen.get(i) as FoodIconName }));
}

/** Slots plus the second copy of an icon that would cross the bottom edge, so the repeat never cuts it */
export function patternIcons(seed?: number): Slot[] {
  const placed: Slot[] = [];
  for (const s of patternSlots(seed)) {
    placed.push(s);
    if (s.y + ICON > TILE_H) placed.push({ ...s, key: `${s.key}-wrap`, y: s.y - TILE_H });
  }
  return placed;
}
