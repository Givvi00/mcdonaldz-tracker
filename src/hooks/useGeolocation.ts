import { useEffect, useState } from 'react';

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

export interface Coords {
  lat: number;
  lon: number;
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus('granted');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { status, coords };
}
