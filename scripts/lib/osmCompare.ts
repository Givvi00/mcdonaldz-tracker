import type { McDonald } from '../../shared/types';
import { distanceKm } from '../../src/utils/geo';

// Weekly check of the restaurant list against OpenStreetMap, in report-only mode: it never changes the list, it points
// out what may have opened or closed. OSM is incomplete (about 1 restaurant out of 10 of ours has no point there), so
// "missing from OSM" does not mean closed. Hence the prudent rules:
//  - a restaurant is a possible closure only if OSM had it before and it has been missing for MISSES_TO_REPORT checks;
//  - an OSM point with no restaurant of ours nearby is a possible opening only after STREAK_TO_REPORT checks in a row;
//  - the first check only learns which of ours exist on OSM: it reports nothing.
// OSM also maps the same restaurant more than once (the building and a point, the play area "PlayPlace", a big mall or
// airport where the point is a couple of hundred metres from ours): a point near any of ours is that one, never new.

export const MATCH_RADIUS_M = 150;
/** A point this close to one of our restaurants is a second drawing of it, not a new restaurant */
export const SAME_PLACE_RADIUS_M = 300;
export const MISSES_TO_REPORT = 2;
export const STREAK_TO_REPORT = 2;

export interface OsmPlace {
  /** e.g. "node/123" */
  osmId: string;
  lat: number;
  lon: number;
  name: string;
  city?: string;
  street?: string;
}

export interface OsmState {
  /** YYYY-MM-DD of the last check */
  lastRun?: string;
  /** Our restaurants seen on OSM at least once, with how many checks in a row they have been missing since */
  seen: Record<string, { osmId: string; lastSeen: string; misses: number }>;
  /** OSM points with none of our restaurants nearby, and in how many checks in a row they appeared */
  unknown: Record<string, { place: OsmPlace; firstSeen: string; streak: number }>;
}

export interface OsmReport {
  firstRun: boolean;
  matched: number;
  /** open restaurants of ours missing from OSM for a while, though OSM had them before */
  possiblyClosed: Array<{ mc: McDonald; lastSeen: string; misses: number }>;
  /** OSM points near none of ours, for a few checks in a row */
  possiblyNew: Array<{ place: OsmPlace; firstSeen: string; nearest?: { name: string; distanceM: number } }>;
  /** OSM points near one of ours marked closed: maybe it reopened */
  possiblyReopened: Array<{ mc: McDonald; place: OsmPlace }>;
}

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** The Overpass answer, as places with a position (ways and areas give their centre) */
export function parseOverpass(elements: OsmElement[]): OsmPlace[] {
  const places: OsmPlace[] = [];
  for (const e of elements) {
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (lat === undefined || lon === undefined) continue;
    const tags = e.tags ?? {};
    // The play area of a restaurant, drawn on its own
    if (/playplace/i.test(tags.name ?? '')) continue;
    places.push({
      osmId: `${e.type}/${e.id}`,
      lat,
      lon,
      name: tags.name ?? tags.brand ?? "McDonald's",
      city: tags['addr:city'],
      street: tags['addr:street'] ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}` : undefined,
    });
  }
  return places;
}

const metres = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => distanceKm(a.lat, a.lon, b.lat, b.lon) * 1000;

/** Pairs each place with at most one restaurant (and the other way round), closest pairs first, within the radius */
function pair(restaurants: McDonald[], places: OsmPlace[]): Map<string, OsmPlace> {
  const candidates: Array<{ mc: McDonald; place: OsmPlace; d: number }> = [];
  for (const mc of restaurants) {
    for (const place of places) {
      // cheap filter before the exact distance: about 0.01° is 1 km
      if (Math.abs(mc.lat - place.lat) > 0.01 || Math.abs(mc.lon - place.lon) > 0.015) continue;
      const d = metres(mc, place);
      if (d <= MATCH_RADIUS_M) candidates.push({ mc, place, d });
    }
  }
  candidates.sort((a, b) => a.d - b.d);
  const byMc = new Map<string, OsmPlace>();
  const usedPlaces = new Set<string>();
  for (const c of candidates) {
    if (byMc.has(c.mc.id) || usedPlaces.has(c.place.osmId)) continue;
    byMc.set(c.mc.id, c.place);
    usedPlaces.add(c.place.osmId);
  }
  return byMc;
}

/** Compares this check with the list and the previous checks; returns the new state and what is worth reporting */
export function compareWithOsm(
  catalog: McDonald[],
  places: OsmPlace[],
  previous: OsmState,
  today: string,
): { state: OsmState; report: OsmReport } {
  const firstRun = !previous.lastRun;
  const open = catalog.filter(mc => mc.opened);
  const closed = catalog.filter(mc => !mc.opened);

  const matchedOpen = pair(open, places);
  const used = new Set([...matchedOpen.values()].map(p => p.osmId));
  const matchedClosed = pair(
    closed,
    places.filter(p => !used.has(p.osmId)),
  );
  for (const p of matchedClosed.values()) used.add(p.osmId);

  const state: OsmState = { lastRun: today, seen: {}, unknown: {} };
  const report: OsmReport = { firstRun, matched: matchedOpen.size, possiblyClosed: [], possiblyNew: [], possiblyReopened: [] };

  for (const mc of open) {
    const place = matchedOpen.get(mc.id);
    const before = previous.seen[mc.id];
    if (place) {
      state.seen[mc.id] = { osmId: place.osmId, lastSeen: today, misses: 0 };
    } else if (before) {
      const misses = before.misses + 1;
      state.seen[mc.id] = { ...before, misses };
      if (misses >= MISSES_TO_REPORT) report.possiblyClosed.push({ mc, lastSeen: before.lastSeen, misses });
    }
    // never seen on OSM: nothing to say, OSM simply does not have it
  }
  // Closed restaurants keep their history, in case they come back
  for (const mc of closed) {
    const place = matchedClosed.get(mc.id);
    if (place) {
      state.seen[mc.id] = { osmId: place.osmId, lastSeen: today, misses: 0 };
      if (!firstRun) report.possiblyReopened.push({ mc, place });
    } else if (previous.seen[mc.id]) {
      state.seen[mc.id] = previous.seen[mc.id];
    }
  }

  const nearOneOfOurs = (place: OsmPlace) =>
    catalog.some(
      mc =>
        Math.abs(mc.lat - place.lat) < 0.01 && Math.abs(mc.lon - place.lon) < 0.015 && metres(mc, place) <= SAME_PLACE_RADIUS_M,
    );
  for (const place of places) {
    if (used.has(place.osmId) || nearOneOfOurs(place)) continue;
    const before = previous.unknown[place.osmId];
    const streak = firstRun ? 1 : (before?.streak ?? 0) + 1;
    const entry = { place, firstSeen: before?.firstSeen ?? today, streak };
    state.unknown[place.osmId] = entry;
    if (!firstRun && streak >= STREAK_TO_REPORT) {
      // Where it is, in words: the closest restaurant we know
      let nearest: { name: string; distanceM: number } | undefined;
      for (const mc of catalog) {
        const d = metres(mc, place);
        if (!nearest || d < nearest.distanceM) nearest = { name: mc.name, distanceM: Math.round(d) };
      }
      report.possiblyNew.push({ place, firstSeen: entry.firstSeen, nearest });
    }
  }

  return { state, report };
}

const osmLink = (p: OsmPlace) => `https://www.openstreetmap.org/${p.osmId}`;
const mapLink = (lat: number, lon: number) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;

/** The report as the text of a GitHub issue (Italian, it is for the owner of the app) */
export function reportMarkdown(report: OsmReport, today: string): string {
  const lines: string[] = [
    `Controllo settimanale dell'elenco con OpenStreetMap, ${today}. **Solo segnalazioni: l'elenco non è stato modificato.**`,
    '',
    `Ristoranti aperti trovati anche su OpenStreetMap: ${report.matched}.`,
    '',
  ];
  if (report.firstRun) {
    lines.push('Primo controllo: serve solo a imparare quali ristoranti esistono su OpenStreetMap, quindi non segnala nulla.');
    return lines.join('\n');
  }
  const section = (title: string, hint: string, rows: string[]) => {
    lines.push(`### ${title} (${rows.length})`, '', `_${hint}_`, '');
    lines.push(...(rows.length ? rows : ['Nessuno.']), '');
  };
  section(
    'Possibili nuovi',
    `Punti McDonald's su OpenStreetMap lontani più di ${SAME_PLACE_RADIUS_M} m da ogni ristorante dell'elenco, presenti da ${STREAK_TO_REPORT} controlli di fila. Controlla sul sito McDonald's prima di aggiungerli.`,
    report.possiblyNew.map(({ place, firstSeen, nearest }) => {
      const where = nearest ? ` · a ${nearest.distanceM >= 1000 ? `${(nearest.distanceM / 1000).toFixed(1).replace('.', ',')} km` : `${nearest.distanceM} m`} da ${nearest.name}` : '';
      return `- **${place.name}**${place.city ? `, ${place.city}` : ''}${place.street ? ` (${place.street})` : ''}${where} · visto dal ${firstSeen} · [mappa](${mapLink(place.lat, place.lon)}) · [OSM](${osmLink(place)})`;
    }),
  );
  section(
    'Possibili chiusi',
    `Ristoranti che OpenStreetMap aveva e che mancano da ${MISSES_TO_REPORT} o più controlli. Può essere chiuso, oppure qualcuno ha solo modificato la mappa.`,
    report.possiblyClosed.map(
      ({ mc, lastSeen, misses }) =>
        `- **${mc.name}** (${mc.id}), ${mc.city} · ultima volta visto il ${lastSeen}, manca da ${misses} controlli · [mappa](${mapLink(mc.lat, mc.lon)})`,
    ),
  );
  section(
    'Possibili riaperture',
    'Ristoranti segnati come chiusi nell’elenco con un punto McDonald’s di nuovo lì.',
    report.possiblyReopened.map(({ mc, place }) => `- **${mc.name}** (${mc.id}), ${mc.city} · [OSM](${osmLink(place)})`),
  );
  lines.push("Per applicare le modifiche serve la raccolta completa da mcdonalds.it: vedi `docs/AGGIORNAMENTO-DATI.md`.");
  lines.push('', 'Dati © OpenStreetMap contributors, ODbL.');
  return lines.join('\n');
}

/** Whether there is anything worth an issue */
export const hasFindings = (r: OsmReport) => r.possiblyNew.length + r.possiblyClosed.length + r.possiblyReopened.length > 0;
