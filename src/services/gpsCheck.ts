import type { McDonald } from '@shared/types';
import { distanceKm } from '@/utils/geo';

// A visit is "verified" only when the phone, at that very moment, reads a fresh and precise position close to the
// restaurant. The position the app reads at startup is not enough: it can be minutes old and very rough (from the
// mobile network), so a visit marked an hour later from the couch would pass, and a real one could fail.

/** How close you must be to the restaurant */
export const GPS_VERIFY_RADIUS_KM = 0.2;
/** How precise the reading must be (the phone's own estimate, in metres): a rough one proves nothing */
export const GPS_MAX_ACCURACY_M = 100;
/** How long to wait for a precise reading before giving up */
const FIX_TIMEOUT_MS = 12000;

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

/** A new, precise reading taken now (never a cached one); null when the phone cannot give one */
export function freshFix(): Promise<Fix | null> {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 0, timeout: FIX_TIMEOUT_MS },
    );
  });
}
