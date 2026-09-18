import { Capacitor } from '@capacitor/core';
import { useMcdonaldStore } from '@/store/mcdonaldStore';

export type UpdateCheck = 'available' | 'current' | 'unavailable';

const CHECK_EVERY_MS = 30 * 60 * 1000;

/**
 * Compares this build with the one currently published (version.json, written at build time).
 * Only meaningful for the installed web app: the Android app is updated by installing a new APK,
 * and the dev server has no published build to compare with.
 */
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (Capacitor.isNativePlatform() || !import.meta.env.PROD) return 'unavailable';
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return 'unavailable';
    const { buildId } = (await response.json()) as { buildId?: unknown };
    if (typeof buildId !== 'string') return 'unavailable';
    const available = buildId !== __BUILD_ID__;
    useMcdonaldStore.getState().setUpdateAvailable(available);
    return available ? 'available' : 'current';
  } catch {
    // Offline or blocked: keep working with the installed version
    return 'unavailable';
  }
}

/** Checks now, when the app comes back to the foreground or the network returns, and every 30 minutes. */
export function startUpdateChecks(): () => void {
  const check = () => void checkForUpdate();
  const onVisible = () => {
    if (document.visibilityState === 'visible') check();
  };
  check();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', check);
  const timer = window.setInterval(check, CHECK_EVERY_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', check);
    window.clearInterval(timer);
  };
}

/** Reloads the page: pages are fetched network-first, so this loads the new build. */
export function applyUpdate() {
  window.location.reload();
}
