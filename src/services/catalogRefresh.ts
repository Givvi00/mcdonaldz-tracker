import { Capacitor } from '@capacitor/core';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { CATALOG_CACHE_KEY, type CatalogPayload } from '@/services/catalogBoot';
import { validateCatalogUpdate } from '@/utils/catalogValidation';

/** The published site: the Android app has no site of its own, so it reads the list from here */
const PUBLISHED_SITE = 'https://givvi00.github.io/mcdonaldz-tracker/';
const REFRESH_EVERY_MS = 6 * 60 * 60 * 1000;

export type CatalogRefresh = 'updated' | 'current' | 'rejected' | 'unavailable';

const dataUrl = () =>
  Capacitor.isNativePlatform() ? `${PUBLISHED_SITE}data/mcdonalds.json` : `${import.meta.env.BASE_URL}data/mcdonalds.json`;

/**
 * Downloads the published restaurant list and, if it is newer and passes the safety checks, switches to it,
 * keeps a copy on the device (used at the next launch, also offline) and updates the screen in place.
 * `no-cache` makes the browser revalidate, so an unchanged list costs a tiny "304 Not Modified" answer.
 */
export async function refreshCatalog(): Promise<CatalogRefresh> {
  if (!import.meta.env.PROD) return 'unavailable';
  try {
    const response = await fetch(dataUrl(), { cache: 'no-cache' });
    if (!response.ok) return 'unavailable';
    const payload = (await response.json()) as Partial<CatalogPayload>;
    if (typeof payload.version !== 'string' || typeof payload.generatedAt !== 'string' || !Array.isArray(payload.restaurants)) {
      return 'rejected';
    }

    const state = useMcdonaldStore.getState();
    if (payload.version === state.catalogInfo.version) return 'current';
    // A list that is not newer than the one in use is ignored (for example an older deployment)
    if (!(Date.parse(payload.generatedAt) > Date.parse(state.catalogInfo.generatedAt))) return 'current';

    const check = validateCatalogUpdate(state.mcdonalds, payload.restaurants);
    if (!check.ok) {
      console.warn(`Elenco ristoranti scartato: ${check.reason}`);
      return 'rejected';
    }

    state.setCatalog(check.restaurants, {
      version: payload.version,
      generatedAt: payload.generatedAt,
      source: 'downloaded',
    });
    try {
      localStorage.setItem(
        CATALOG_CACHE_KEY,
        JSON.stringify({ version: payload.version, generatedAt: payload.generatedAt, restaurants: check.restaurants })
      );
    } catch {
      // Storage full or blocked: the new list still applies for this session
    }
    return 'updated';
  } catch {
    // Offline or blocked: keep working with the list already in use
    return 'unavailable';
  }
}

/** Refreshes now, when the app returns to the foreground or the network comes back, and every 6 hours. */
export function startCatalogRefresh(): () => void {
  const refresh = () => void refreshCatalog();
  const onVisible = () => {
    if (document.visibilityState === 'visible') refresh();
  };
  refresh();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', refresh);
  const timer = window.setInterval(refresh, REFRESH_EVERY_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', refresh);
    window.clearInterval(timer);
  };
}
