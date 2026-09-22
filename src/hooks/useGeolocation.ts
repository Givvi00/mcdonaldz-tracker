import { useEffect, useState } from 'react';

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

export interface Coords {
  lat: number;
  lon: number;
}

/** While the app is on screen, read the position again this often (you may be walking towards a restaurant) */
const REFRESH_MS = 2 * 60 * 1000;

/**
 * Where you are, kept up to date: read when the app opens, again whenever it comes back on screen (a web app stays
 * open in the background: opened at home, it is brought back at the restaurant) and every couple of minutes while
 * in use. A reading that fails later keeps the last good one, unless the permission itself was taken away.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('loading');
    let cancelled = false;

    const read = () =>
      navigator.geolocation.getCurrentPosition(
        pos => {
          if (cancelled) return;
          setCoords(prev =>
            prev && prev.lat === pos.coords.latitude && prev.lon === pos.coords.longitude
              ? prev
              : { lat: pos.coords.latitude, lon: pos.coords.longitude },
          );
          setStatus('granted');
        },
        error => {
          if (cancelled) return;
          if (error.code === error.PERMISSION_DENIED) setStatus('denied');
          else setStatus(s => (s === 'loading' ? 'denied' : s));
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60 * 1000 },
      );

    read();
    const onVisible = () => {
      if (document.visibilityState === 'visible') read();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') read();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  return { status, coords };
}
