// mcdonalds.it is behind bot protection that blocks plain HTTP requests (curl, node-fetch),
// so the raw list has to be scraped from within a real browser session first (see project notes).
// This script only transforms that raw export into the app's data format.
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import type { McDonald } from '../shared/types';

interface ScrapedEntry {
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

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: tsx scripts/fetch-mcdonalds.ts <raw-scraped.json>');
  process.exit(1);
}

const raw: ScrapedEntry[] = JSON.parse(readFileSync(inputPath, 'utf-8'));

const mcdonalds: McDonald[] = raw
  .filter(e => e.lat != null && e.lng != null && e.name)
  .sort((a, b) => a.region.localeCompare(b.region) || a.city.localeCompare(b.city))
  .map((e, i) => ({
    id: `mc${String(i + 1).padStart(4, '0')}`,
    name: e.name.startsWith("McDonald's") ? e.name : `McDonald's ${e.name}`,
    lat: e.lat,
    lon: e.lng,
    region: e.region,
    city: e.city,
    address: `${e.street}, ${e.city}`,
    opened: true,
  }));

const outputPath = path.resolve(import.meta.dirname, '../shared/data/mcdonalds.json');
writeFileSync(outputPath, JSON.stringify(mcdonalds, null, 2) + '\n');
console.log(`Wrote ${mcdonalds.length} restaurants to ${outputPath}`);
