import { isAndroid, isAppleTouchDevice } from '@/utils/platform';

export interface Destination {
  name: string;
  lat: number;
  lon: number;
}

/** Maps apps that can be opened from a web address on iPhone/iPad (there is no "default maps app" a web page can use there). */
export type MapApp = 'apple' | 'google' | 'waze';

export const MAP_APPS: Array<{ value: MapApp; label: string; icon: string }> = [
  { value: 'apple', label: 'Apple Maps', icon: '🍎' },
  { value: 'google', label: 'Google Maps', icon: '📍' },
  { value: 'waze', label: 'Waze', icon: '🚗' },
];

export function isMapApp(value: unknown): value is MapApp {
  return value === 'apple' || value === 'google' || value === 'waze';
}

export function mapAppUrl(app: MapApp, { name, lat, lon }: Destination): string {
  switch (app) {
    case 'apple':
      return `https://maps.apple.com/?daddr=${lat},${lon}&q=${encodeURIComponent(name)}&dirflg=d`;
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    case 'waze':
      return `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
  }
}

/** geo: hands the place to whatever maps app the Android phone has set as default. */
export function geoUrl({ name, lat, lon }: Destination): string {
  return `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`;
}

export interface DirectionsEnv {
  /** Running inside the Capacitor Android app */
  nativeAndroid: boolean;
  ua: string;
  maxTouchPoints: number;
  /** The maps app chosen earlier on iPhone/iPad, if any */
  saved: MapApp | null;
}

/**
 * What "Portami lì" should do:
 * - Android (app or web app in Chrome): geo:, so the default maps app opens
 * - iPhone/iPad: the app chosen before; if none yet, ask which one
 * - anything else (computer): Google Maps in the browser
 */
export type DirectionsPlan = { kind: 'open'; url: string } | { kind: 'choose' };

export function directionsPlan(env: DirectionsEnv, dest: Destination): DirectionsPlan {
  if (env.nativeAndroid || isAndroid(env.ua)) return { kind: 'open', url: geoUrl(dest) };
  if (isAppleTouchDevice(env.ua, env.maxTouchPoints)) {
    return env.saved ? { kind: 'open', url: mapAppUrl(env.saved, dest) } : { kind: 'choose' };
  }
  return { kind: 'open', url: mapAppUrl('google', dest) };
}
