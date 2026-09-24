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

const UPDATED_KEY = 'mcdz-updated-from';

/**
 * Checks now, when the app comes back to the foreground or the network returns, and every 30 minutes. A newer build is
 * applied on its own the moment the app goes to the background: nobody is looking, so nothing is interrupted, and on
 * the way back the new version is already there. Not while a position check is running (it would be lost).
 */
export function startUpdateChecks(): () => void {
  const check = () => void checkForUpdate();
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      check();
      return;
    }
    const { updateAvailable, verifying } = useMcdonaldStore.getState();
    if (updateAvailable && verifying.length === 0) applyUpdate();
  };
  check();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', check);
  const timer = window.setInterval(check, CHECK_EVERY_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', check);
    window.clearInterval(timer);
  };
}

/** Reloads the page: pages are fetched network-first, so this loads the new build. Remembers it, to say so after. */
export function applyUpdate() {
  try {
    sessionStorage.setItem(UPDATED_KEY, __BUILD_ID__);
  } catch {
    // storage unavailable: the update still happens, just without the "updated" notice
  }
  window.location.reload();
}

/** True once, right after an update was applied (the build changed across the reload) */
export function justUpdated(): boolean {
  try {
    const from = sessionStorage.getItem(UPDATED_KEY);
    sessionStorage.removeItem(UPDATED_KEY);
    return !!from && from !== __BUILD_ID__;
  } catch {
    return false;
  }
}
