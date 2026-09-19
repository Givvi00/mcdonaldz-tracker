import type { McDonald } from '@shared/types';

/** A refreshed list is never trusted blindly: it must look like the app's own data and must not lose anything. */
export const MAX_NEW_RESTAURANTS = 300;
/** Same brake as the server-side merge: more closures than this in one go means a bad source, not real closures */
export const MAX_CLOSED_RATIO = 0.15;

export type CatalogCheck = { ok: true; restaurants: McDonald[] } | { ok: false; reason: string };

const ID_PATTERN = /^mc\d{4,}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Italy including the islands, with margin
const LAT_RANGE: [number, number] = [34, 49];
const LON_RANGE: [number, number] = [5, 20];

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isNumberIn = (value: unknown, [min, max]: [number, number]): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const isOptionalDate = (value: unknown) => value === undefined || (typeof value === 'string' && DATE_PATTERN.test(value));

const fail = (reason: string): CatalogCheck => ({ ok: false, reason });

/**
 * Decides whether `incoming` may replace `current`.
 * Accepts only a well-formed list that keeps every id already known (ids are never deleted or reused: visits point to them),
 * does not add an implausible number of restaurants and does not close an implausible share of the open ones.
 */
export function validateCatalogUpdate(current: McDonald[], incoming: unknown): CatalogCheck {
  if (!Array.isArray(incoming)) return fail('non è un elenco');

  const ids = new Set<string>();
  for (let i = 0; i < incoming.length; i++) {
    const r = incoming[i] as Record<string, unknown> | null;
    if (typeof r !== 'object' || r === null) return fail(`voce ${i}: non è un oggetto`);
    if (typeof r.id !== 'string' || !ID_PATTERN.test(r.id)) return fail(`voce ${i}: ID non valido`);
    if (ids.has(r.id)) return fail(`ID duplicato: ${r.id}`);
    ids.add(r.id);
    if (!isText(r.name) || !isText(r.region) || !isText(r.city)) return fail(`${r.id}: nome, regione o città mancanti`);
    if (typeof r.address !== 'string') return fail(`${r.id}: indirizzo mancante`);
    if (!isNumberIn(r.lat, LAT_RANGE) || !isNumberIn(r.lon, LON_RANGE)) return fail(`${r.id}: coordinate non valide`);
    if (typeof r.opened !== 'boolean') return fail(`${r.id}: stato aperto/chiuso mancante`);
    if (!isOptionalDate(r.closedAt) || !isOptionalDate(r.addedAt)) return fail(`${r.id}: data non valida`);
  }

  for (const mc of current) {
    if (!ids.has(mc.id)) return fail(`manca l'ID ${mc.id}: un elenco non deve perdere ristoranti`);
  }

  if (incoming.length - current.length > MAX_NEW_RESTAURANTS) {
    return fail(`troppi ristoranti nuovi in una volta (${incoming.length - current.length})`);
  }

  const incomingById = new Map((incoming as McDonald[]).map(mc => [mc.id, mc]));
  const openNow = current.filter(mc => mc.opened);
  const newlyClosed = openNow.filter(mc => incomingById.get(mc.id)?.opened === false).length;
  if (openNow.length > 0 && newlyClosed / openNow.length > MAX_CLOSED_RATIO) {
    return fail(`troppe chiusure in una volta (${newlyClosed} su ${openNow.length})`);
  }

  return { ok: true, restaurants: incoming as McDonald[] };
}
