// Updates shared/data/mcdonalds.json from a fresh scrape of mcdonalds.it.
//
// mcdonalds.it is behind bot protection that blocks plain HTTP requests (curl, node-fetch),
// so the raw list has to be scraped from within a real browser session first (see docs/AGGIORNAMENTO-DATI.md).
// This script merges that raw export into the existing catalogue WITHOUT renumbering ids:
// visits are stored by id, so an id must keep pointing at the same restaurant forever.
//
// Usage: tsx scripts/fetch-mcdonalds.ts <raw-scraped.json> [--dry-run] [--force]
//   --dry-run  print the report only, write nothing
//   --force    write even if more than 5% of the restaurants would be added/closed (probably a bad scrape)
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { McDonald } from '../shared/types';
import { changeRatio, formatId, mergeCatalog, toRecord, type RawEntry } from './lib/merge';

const MAX_CHANGE_RATIO = 0.05;

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const inputPath = args.find(a => !a.startsWith('--'));
if (!inputPath) {
  console.error('Usage: tsx scripts/fetch-mcdonalds.ts <raw-scraped.json> [--dry-run] [--force]');
  process.exit(1);
}

const outputPath = path.resolve(import.meta.dirname, '../shared/data/mcdonalds.json');
// Files saved from Windows tools often start with an invisible BOM character, which JSON.parse rejects
const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf-8').replace(/^﻿/, ''));

const raw: RawEntry[] = readJson(inputPath);
const existing: McDonald[] = existsSync(outputPath) ? readJson(outputPath) : [];
const today = new Date().toISOString().slice(0, 10);

let catalog: McDonald[];
if (existing.length === 0) {
  // First import: number in region/city order, as the original dataset was
  catalog = raw
    .filter(e => e.lat != null && e.lng != null && e.name)
    .sort((a, b) => a.region.localeCompare(b.region) || a.city.localeCompare(b.city))
    .map((e, i) => ({ id: formatId(i + 1), ...toRecord(e), opened: true }));
  console.log(`Primo import: ${catalog.length} ristoranti.`);
} else {
  const merged = mergeCatalog(existing, raw, { today });
  const { report } = merged;
  const list = (items: McDonald[]) => items.slice(0, 15).map(mc => `   ${mc.id}  ${mc.name}  (${mc.city})`);

  console.log(`Ristoranti nel file attuale: ${existing.length} (${existing.filter(m => m.opened).length} aperti)`);
  console.log(`Nella nuova raccolta:        ${raw.length}`);
  console.log(`Invariati: ${report.unchanged}`);
  console.log(`Nuovi: ${report.added.length}`);
  list(report.added).forEach(l => console.log(l));
  console.log(`Chiusi: ${report.closed.length}`);
  list(report.closed).forEach(l => console.log(l));
  console.log(`Riaperti: ${report.reopened.length}`);
  list(report.reopened).forEach(l => console.log(l));
  console.log(`Modificati (nome, indirizzo, posizione): ${report.updated.length}`);
  report.updated.slice(0, 15).forEach(u => console.log(`   ${u.id}  ${u.name}: ${u.changes.join('; ')}`));

  const ratio = changeRatio(existing, report);
  if (ratio > MAX_CHANGE_RATIO && !flags.has('--force')) {
    console.error(
      `\nSTOP: cambierebbe il ${(ratio * 100).toFixed(1)}% dei ristoranti aperti (limite ${MAX_CHANGE_RATIO * 100}%). ` +
        `Probabilmente la raccolta è incompleta o sbagliata. Controlla il file, oppure usa --force se è corretto.`
    );
    process.exit(2);
  }
  catalog = merged.catalog;
}

if (flags.has('--dry-run')) {
  console.log('\n--dry-run: nessun file scritto.');
} else {
  writeFileSync(outputPath, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`\nScritti ${catalog.length} ristoranti in ${outputPath}`);
}
