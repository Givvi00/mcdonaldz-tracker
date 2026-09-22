import type { McDonald } from '@shared/types';
import { distanceKm } from '@/utils/geo';

// A visit is "verified" only when the phone, at that very moment, reads a fresh and precise position close to the
// restaurant. The position the app reads at startup is not enough: it can be minutes old and very rough (from the
// mobile network), so a visit marked an hour later from the couch would pass, and a real one could fail.

/** How close you must be to the restaurant */
export const GPS_VERIFY_RADIUS_KM = 0.2;
/**
 * How precise the reading must be (the phone's own estimate, in metres): a rough one proves nothing. Inside a building
 * a phone often stays around 50-150 m, and a computer (Wi-Fi only) rarely does better than ~150 m.
 */
export const GPS_MAX_ACCURACY_M = 150;
/** How long to keep listening for a better reading before judging the best one received */
const FIX_WINDOW_MS = 10000;
/** A reading this good is enough: stop listening at once */
const GOOD_ENOUGH_M = 40;

export interface Fix {
  lat: number;
  lon: number;
  /** metres, as estimated by the phone */
  accuracy: number;
}

export type VerifyOutcome =
  | { result: 'ok' }
  /** precise enough, but too far away: how far, in metres */
  | { result: 'far'; distanceM: number }
  /** the reading is too rough to prove anything */
  | { result: 'imprecise'; accuracyM: number }
  /** no position at all (permission denied, no signal, timeout) */
  | { result: 'unavailable' };

/** The rule, on its own: is this reading proof that you are at this restaurant? */
export function judgeFix(fix: Fix | null, mc: Pick<McDonald, 'lat' | 'lon'>): VerifyOutcome {
  if (!fix) return { result: 'unavailable' };
  const distanceM = Math.round(distanceKm(fix.lat, fix.lon, mc.lat, mc.lon) * 1000);
  // Clearly far away, however rough the reading: say how far, it is the useful message
  if (distanceM - fix.accuracy > GPS_VERIFY_RADIUS_KM * 1000) return { result: 'far', distanceM };
  if (fix.accuracy > GPS_MAX_ACCURACY_M) return { result: 'imprecise', accuracyM: Math.round(fix.accuracy) };
  if (distanceM > GPS_VERIFY_RADIUS_KM * 1000) return { result: 'far', distanceM };
  return { result: 'ok' };
}

/** How close the app's last known position must be for "Verifica ora" to be offered (the real check is stricter) */
export const VERIFY_OFFER_KM = 1;

/** Whether to offer "Verifica ora" on a visit you marked without the GPS confirming it, now that you seem to be there */
export function canOfferVerify(
  visit: { verified?: boolean } | undefined,
  mc: Pick<McDonald, 'lat' | 'lon'>,
  position: { lat: number; lon: number } | null,
): boolean {
  if (!visit || visit.verified || !position) return false;
  return distanceKm(position.lat, position.lon, mc.lat, mc.lon) <= VERIFY_OFFER_KM;
}

/**
 * The best reading the phone gives in the next few seconds (never a cached one); null when it gives none. The first
 * reading is often rough (the GPS is just waking up, or you are indoors) and improves after a moment, so it keeps
 * listening and returns early as soon as one is good enough (or already proves you are at the target restaurant).
 */
export function freshFix(target?: Pick<McDonald, 'lat' | 'lon'>): Promise<Fix | null> {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    let best: Fix | null = null;
    let done = false;
    let watchId: number | null = null;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      resolve(best);
    };
    const timer = setTimeout(finish, FIX_WINDOW_MS);
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const fix = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
        if (!best || fix.accuracy < best.accuracy) best = fix;
        // Already proof enough that you are there, or as precise as it gets: no need to wait any longer
        if (fix.accuracy <= GOOD_ENOUGH_M || (target && judgeFix(best, target).result === 'ok')) finish();
      },
      // Permission denied: no point in waiting. Other errors (no signal yet) may pass: keep listening
      error => {
        if (error.code === error.PERMISSION_DENIED) finish();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: FIX_WINDOW_MS },
    );
  });
}
