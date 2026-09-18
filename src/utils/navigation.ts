import { Capacitor } from '@capacitor/core';

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

function isApple(): boolean {
  if (Capacitor.getPlatform() === 'ios') return true;
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for a touch screen
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Link that opens turn-by-turn directions to a McDonald's.
 * Android app: the geo: scheme lets the system pick the default maps app.
 * iPhone/iPad: Apple Maps. Everything else: Google Maps.
 */
export function directionsUrl({ name, lat, lon }: Destination): string {
  if (Capacitor.getPlatform() === 'android') {
    return `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`;
  }
  if (isApple()) {
    return `https://maps.apple.com/?daddr=${lat},${lon}&q=${encodeURIComponent(name)}&dirflg=d`;
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
