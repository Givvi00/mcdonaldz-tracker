import bundledData from '@shared/data/mcdonalds.json';
import type { McDonald } from '@shared/types';
import { validateCatalogUpdate } from '@/utils/catalogValidation';

export interface CatalogInfo {
  /** Hash of the list content: changes only when the data does */
  version: string;
  /** When the list was published (or, for the bundled one, when this app build was made) */
  generatedAt: string;
  source: 'bundled' | 'downloaded';
}

/** Shape of data/mcdonalds.json as published by the site */
export interface CatalogPayload {
  version: string;
  generatedAt: string;
  restaurants: McDonald[];
}

export const CATALOG_CACHE_KEY = 'mcdz-catalog-v1';

const bundled = bundledData as McDonald[];
const bundledInfo: CatalogInfo = { version: __CATALOG_VERSION__, generatedAt: __BUILD_DATE__, source: 'bundled' };

function readCached(): CatalogPayload | null {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as Partial<CatalogPayload>;
    if (typeof payload.version !== 'string' || typeof payload.generatedAt !== 'string') return null;
    if (Number.isNaN(Date.parse(payload.generatedAt)) || !Array.isArray(payload.restaurants)) return null;
    return payload as CatalogPayload;
  } catch {
    return null;
  }
}

/**
 * The list the app starts with: the one downloaded earlier if it is valid and newer than the list bundled in this build,
 * otherwise the bundled one. Runs synchronously so the first screen already shows the freshest data available.
 */
export function pickInitialCatalog(): { restaurants: McDonald[]; info: CatalogInfo } {
  const cached = readCached();
  if (
    cached &&
    cached.version !== bundledInfo.version &&
    Date.parse(cached.generatedAt) > Date.parse(bundledInfo.generatedAt)
  ) {
    const check = validateCatalogUpdate(bundled, cached.restaurants);
    if (check.ok) {
      return {
        restaurants: check.restaurants,
        info: { version: cached.version, generatedAt: cached.generatedAt, source: 'downloaded' },
      };
    }
  }
  return { restaurants: bundled, info: bundledInfo };
}
