import { Capacitor } from '@capacitor/core';

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

/**
 * Link that opens turn-by-turn directions to a McDonald's.
 * On Android (Capacitor) the geo: scheme lets the system pick the default maps app;
 * on the web it falls back to Google Maps directions.
 */
export function directionsUrl({ name, lat, lon }: Destination): string {
  if (Capacitor.getPlatform() === 'android') {
    return `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function openDirections(dest: Destination) {
  const url = directionsUrl(dest);
  if (url.startsWith('geo:')) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener');
  }
}
