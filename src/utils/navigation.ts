import { Capacitor } from '@capacitor/core';
import { isAppleTouchDevice } from '@/utils/platform';
import { directionsPlan, isMapApp, mapAppUrl, type Destination, type MapApp } from '@/utils/directions';

export type { Destination, MapApp } from '@/utils/directions';

const MAP_APP_KEY = 'mcdz-maps-app';
export const CHOOSE_MAP_APP_EVENT = 'mcdz:choose-map-app';

export function getSavedMapApp(): MapApp | null {
  try {
    const value = localStorage.getItem(MAP_APP_KEY);
    return isMapApp(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveMapApp(app: MapApp) {
  try {
    localStorage.setItem(MAP_APP_KEY, app);
  } catch {
    // storage blocked: the choice is asked again next time
  }
}

/** iPhone/iPad, where the maps app is chosen by the user (the web has no default maps app there) */
export function choosesMapApp(): boolean {
  return Capacitor.getPlatform() === 'ios' || isAppleTouchDevice(navigator.userAgent, navigator.maxTouchPoints);
}

function openUrl(url: string) {
  if (url.startsWith('geo:')) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

/** Open directions in the maps app; on iPhone the first time it asks which one (see MapAppChooser) */
export function openDirections(dest: Destination) {
  const plan = directionsPlan(
    {
      nativeAndroid: Capacitor.getPlatform() === 'android',
      ua: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      saved: getSavedMapApp(),
    },
    dest,
  );
  if (plan.kind === 'open') {
    openUrl(plan.url);
  } else {
    window.dispatchEvent(new CustomEvent<Destination>(CHOOSE_MAP_APP_EVENT, { detail: dest }));
  }
}

/** Remember the app and open the directions with it */
export function openDirectionsWith(app: MapApp, dest: Destination) {
  saveMapApp(app);
  openUrl(mapAppUrl(app, dest));
}
