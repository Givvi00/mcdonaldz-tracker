// Geometry helpers for the region stickers (kept apart from the component so they can be tested).

/** Long names go on two lines, split after a hyphen or at a space, as evenly as possible */
export function splitName(name: string, maxOneLine = 9): string[] {
  if (name.length <= maxOneLine) return [name];
  const tokens = name.split(/(?<=-)|\s+/).filter(Boolean);
  if (tokens.length < 2) return [name];
  let best: [string, string] = [tokens[0], tokens.slice(1).join(' ')];
  let bestMax = Infinity;
  for (let i = 1; i < tokens.length; i++) {
    const first = tokens.slice(0, i).join(' ').replace(/- /g, '-');
    const second = tokens.slice(i).join(' ');
    const longest = Math.max(first.length, second.length);
    if (longest < bestMax) {
      bestMax = longest;
      best = [first, second];
    }
  }
  return best;
}

/** Vertices of an "M x,y L x,y ... Z" path */
export function pathPoints(path: string): Array<[number, number]> {
  return [...path.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map(m => [Number(m[1]), Number(m[2])]);
}

export function pointInPolygon(x: number, y: number, points: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Small seeded generator, so the same region always gets the same dots and bubbles */
export function seededRandom(seed: string): () => number {
  let a = 0;
  for (let i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random points inside the region's outline */
export function pointsInside(path: string, width: number, height: number, count: number, seed: string, minY = 0): Array<[number, number]> {
  const polygon = pathPoints(path);
  const random = seededRandom(seed);
  const found: Array<[number, number]> = [];
  for (let tries = 0; found.length < count && tries < 4000; tries++) {
    const x = random() * width;
    const y = minY + random() * (height - minY);
    if (pointInPolygon(x, y, polygon)) found.push([x, y]);
  }
  return found;
}
