// Weekly check of the restaurant list against OpenStreetMap (report only: the list is never changed).
// Run with: npm run osm-check            (writes shared/data/osm-state.json and osm-report.md)
//           npm run osm-check -- --from osm.json   (uses a saved Overpass answer instead of downloading)
// The GitHub Action .github/workflows/osm-check.yml runs it every week and opens an issue when there is something to see.
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { McDonald } from '../shared/types';
import { compareWithOsm, hasFindings, parseOverpass, reportMarkdown, type OsmState } from './lib/osmCompare';

const ROOT = path.resolve(import.meta.dirname, '..');
const CATALOG = path.join(ROOT, 'shared/data/mcdonalds.json');
const STATE = path.join(ROOT, 'shared/data/osm-state.json');
const REPORT = path.join(ROOT, 'osm-report.md');

// McDonald's by its brand code, or by its exact name: a "contains" search over all of Italy is too slow for the servers
const QUERY = `[out:json][timeout:300];
area["ISO3166-1"="IT"][admin_level=2]->.it;
(
  nwr["amenity"="fast_food"]["brand:wikidata"="Q38076"](area.it);
  nwr["amenity"="fast_food"]["name"="McDonald's"](area.it);
);
out center tags;`;

const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
// The servers ask to be told who is calling; anonymous requests are refused
const USER_AGENT = 'mcdonaldz-tracker/1.0 (https://github.com/Givvi00/mcdonaldz-tracker)';
// Fewer than this many points means a broken answer (the list has ~830 restaurants, OSM ~790): better stop than
// learn from it that everything closed
const MIN_PLACES = 500;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function download(): Promise<unknown[]> {
  let lastError = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    const server = SERVERS[attempt % SERVERS.length];
    try {
      const res = await fetch(server, {
        method: 'POST',
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: QUERY }),
        signal: AbortSignal.timeout(330_000),
      });
      const text = await res.text();
      if (!res.ok || !text.trimStart().startsWith('{')) throw new Error(`${res.status} ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
      const json = JSON.parse(text) as { elements: unknown[]; remark?: string };
      if (json.remark) throw new Error(json.remark);
      return json.elements;
    } catch (error) {
      lastError = `${server}: ${(error as Error).message}`;
      console.warn(`Tentativo ${attempt + 1} non riuscito: ${lastError}`);
      await sleep(30_000 * (attempt + 1));
    }
  }
  throw new Error(`OpenStreetMap non risponde: ${lastError}`);
}

async function main() {
  const fromIndex = process.argv.indexOf('--from');
  const elements =
    fromIndex > 0 ? (JSON.parse(readFileSync(process.argv[fromIndex + 1], 'utf8')).elements as unknown[]) : await download();
  const places = parseOverpass(elements as Parameters<typeof parseOverpass>[0]);
  console.log(`Punti McDonald's su OpenStreetMap: ${places.length}`);
  if (places.length < MIN_PLACES) {
    throw new Error(`Solo ${places.length} punti: risposta incompleta, niente viene salvato`);
  }

  const data = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const catalog: McDonald[] = Array.isArray(data) ? data : data.restaurants;
  const previous: OsmState = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { seen: {}, unknown: {} };
  const today = new Date().toISOString().slice(0, 10);

  const { state, report } = compareWithOsm(catalog, places, previous, today);
  writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n');
  const text = reportMarkdown(report, today);
  writeFileSync(REPORT, text + '\n');
  console.log(text);
  // For the GitHub Action: whether to open an issue
  if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `findings=${hasFindings(report)}\n`, { flag: 'a' });
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
