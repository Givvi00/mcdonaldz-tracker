import type { McDonald } from '../../shared/types';
import { distanceKm } from '../../src/utils/geo';

/** One restaurant as exported by the browser scrape of mcdonalds.it */
export interface RawEntry {
  slug: string;
  name: string;
  region: string;
  citySlug: string;
  city: string;
  street: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface MergeOptions {
  /** YYYY-MM-DD, stored as addedAt / closedAt */
  today: string;
  /** Same place under a different name (renamed): match within this many metres */
  matchRadiusM?: number;
  /** Same name and city (moved): match within this many metres */
  sameNameRadiusM?: number;
}

export interface MergeReport {
  unchanged: number;
  added: McDonald[];
  closed: McDonald[];
  reopened: McDonald[];
  updated: Array<{ id: string; name: string; changes: string[] }>;
}

const MOVED_THRESHOLD_M = 20;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function formatId(n: number): string {
  return `mc${String(n).padStart(4, '0')}`;
}

function idNumber(id: string): number {
  const n = Number(id.replace(/^mc/, ''));
  return Number.isFinite(n) ? n : 0;
}

export function toRecord(e: RawEntry): Omit<McDonald, 'id' | 'opened'> {
  return {
    name: e.name.startsWith("McDonald's") ? e.name : `McDonald's ${e.name}`,
    lat: e.lat,
    lon: e.lng,
    region: e.region,
    city: e.city,
    address: `${e.street}, ${e.city}`,
  };
}

const metres = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
  distanceKm(a.lat, a.lon, b.lat, b.lon) * 1000;

/**
 * Merges a fresh scrape into the current catalogue WITHOUT ever renumbering:
 * - a restaurant that is still there keeps its id (matched by name+city, or by position if it was renamed);
 * - a new one gets the next free number, which is never reused;
 * - one that disappeared is marked closed (opened: false + closedAt), never deleted, so visits stay valid;
 * - a closed one that reappears is reopened with its original id.
 * Order of the input does not matter. New entries are appended at the end.
 */
export function mergeCatalog(
  existing: McDonald[],
  raw: RawEntry[],
  options: MergeOptions
): { catalog: McDonald[]; report: MergeReport } {
  const matchRadiusM = options.matchRadiusM ?? 150;
  const sameNameRadiusM = options.sameNameRadiusM ?? 2000;

  const scraped = raw
    .filter(e => e.lat != null && e.lng != null && e.name)
    .map(e => ({ entry: e, record: toRecord(e) }));

  // Candidate pairs, best first: same name+city (pass 1), then same spot under another name (pass 2)
  const pairs: Array<{ r: number; e: number; pass: 1 | 2; dist: number }> = [];
  scraped.forEach((s, r) => {
    const key = `${normalize(s.record.name)}|${normalize(s.record.city)}`;
    existing.forEach((ex, e) => {
      const dist = metres(s.record, ex);
      const sameName = key === `${normalize(ex.name)}|${normalize(ex.city)}`;
      if (sameName && dist <= sameNameRadiusM) pairs.push({ r, e, pass: 1, dist });
      else if (dist <= matchRadiusM) pairs.push({ r, e, pass: 2, dist });
    });
  });
  pairs.sort((a, b) => a.pass - b.pass || a.dist - b.dist);

  const matchedRaw = new Map<number, number>(); // raw index -> existing index
  const matchedExisting = new Set<number>();
  for (const p of pairs) {
    if (matchedRaw.has(p.r) || matchedExisting.has(p.e)) continue;
    matchedRaw.set(p.r, p.e);
    matchedExisting.add(p.e);
  }

  const report: MergeReport = { unchanged: 0, added: [], closed: [], reopened: [], updated: [] };
  const catalog: McDonald[] = existing.map(ex => ({ ...ex }));

  for (const [r, e] of matchedRaw) {
    const record = scraped[r].record;
    const current = catalog[e];
    const changes: string[] = [];

    if (current.name !== record.name) changes.push(`nome: ${current.name} → ${record.name}`);
    if (current.address !== record.address) changes.push(`indirizzo: ${current.address} → ${record.address}`);
    if (current.region !== record.region) changes.push(`regione: ${current.region} → ${record.region}`);
    if (current.city !== record.city) changes.push(`città: ${current.city} → ${record.city}`);
    const moved = metres(record, current);
    if (moved > MOVED_THRESHOLD_M) changes.push(`spostato di ${Math.round(moved)} m`);

    const wasClosed = !current.opened;
    if (changes.length > 0) {
      Object.assign(current, record);
      report.updated.push({ id: current.id, name: current.name, changes });
    }
    if (wasClosed) {
      current.opened = true;
      delete current.closedAt;
      report.reopened.push(current);
    } else if (changes.length === 0) {
      report.unchanged += 1;
    }
  }

  // Gone from the scrape: close it (only the first time, so closedAt keeps the date it was noticed)
  existing.forEach((ex, e) => {
    if (matchedExisting.has(e) || !ex.opened) return;
    catalog[e].opened = false;
    catalog[e].closedAt = options.today;
    report.closed.push(catalog[e]);
  });

  // New restaurants: next free numbers, never reused (closed entries stay in the list, so the max is safe)
  let next = existing.reduce((max, ex) => Math.max(max, idNumber(ex.id)), 0) + 1;
  scraped.forEach((s, r) => {
    if (matchedRaw.has(r)) return;
    const created: McDonald = { id: formatId(next++), ...s.record, opened: true, addedAt: options.today };
    catalog.push(created);
    report.added.push(created);
  });

  return { catalog, report };
}

/** Share of the currently open restaurants that this merge would add or close. Used as a sanity brake. */
export function changeRatio(existing: McDonald[], report: MergeReport): number {
  const open = existing.filter(mc => mc.opened).length;
  return (report.added.length + report.closed.length) / Math.max(open, 1);
}
