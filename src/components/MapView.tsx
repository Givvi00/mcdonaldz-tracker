import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import type { McDonald } from '@shared/types';

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© OpenStreetMap contributors';

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const children = cluster.getAllChildMarkers();
  const count = children.length;
  const anyVisited = children.some(m => (m.options as { mcVisited?: boolean }).mcVisited);
  const size = count < 10 ? 38 : count < 50 ? 46 : 56;

  return L.divIcon({
    html: `
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #DA291C, #a8180d);
        color: white;
        font-family: 'Fredoka', sans-serif;
        font-weight: 600;
        font-size: ${count < 50 ? '13px' : '15px'};
        border: 3px solid ${anyVisited ? '#22c55e' : 'white'};
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      ">${count}</div>
    `,
    className: '',
    iconSize: L.point(size, size),
  });
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const clusterGroup = useRef<L.MarkerClusterGroup | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const { mcdonalds, visits, isVisited, toggleVisit, mapFocusId, clearMapFocus } = useMcdonaldStore();
  const [query, setQuery] = useState('');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const results = useMemo<McDonald[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mcdonalds
      .filter(mc => mc.name.toLowerCase().includes(q) || mc.city.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, mcdonalds]);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, { zoomControl: false }).setView([41.8719, 12.5674], 6);
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);

    L.tileLayer(OSM_TILES, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map.current);

    clusterGroup.current = L.markerClusterGroup({
      iconCreateFunction: clusterIcon,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
    });
    map.current.addLayer(clusterGroup.current);

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Render markers
  useEffect(() => {
    if (!map.current || !clusterGroup.current) return;

    clusterGroup.current.clearLayers();
    markers.current.clear();

    mcdonalds.forEach((mc) => {
      const visited = isVisited(mc.id);
      const icon = L.divIcon({
        html: `
          <div style="
            background: ${visited ? 'linear-gradient(135deg, #4ade80, #16a34a)' : 'linear-gradient(135deg, #DA291C, #a8180d)'};
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            cursor: pointer;
          ">
            ${visited ? '✓' : '🍟'}
          </div>
        `,
        iconSize: [30, 30],
        className: '',
      });

      const marker = L.marker([mc.lat, mc.lon], { icon, mcVisited: visited } as L.MarkerOptions);
      marker.bindPopup(`
        <div style="font-size: 13px; min-width: 160px;">
          <strong style="font-family: 'Fredoka', sans-serif; font-size: 14px;">${mc.name}</strong><br/>
          <span style="color: #6b7280;">${mc.city}, ${mc.region}</span><br/>
          <button id="toggle-${mc.id}" style="
            margin-top: 8px;
            padding: 6px 12px;
            background: ${visited ? '#16a34a' : '#DA291C'};
            color: white;
            border: none;
            border-radius: 999px;
            cursor: pointer;
            font-weight: 600;
            font-family: 'Fredoka', sans-serif;
            font-size: 12px;
          ">
            ${visited ? '✓ Visitato' : '🍟 Segna visita'}
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`toggle-${mc.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            toggleVisit(mc.id);
          };
        }
      });

      markers.current.set(mc.id, marker);
      clusterGroup.current!.addLayer(marker);
    });
  }, [mcdonalds, visits, isVisited, toggleVisit]);

  const selectResult = (mc: McDonald) => {
    setQuery('');
    map.current?.flyTo([mc.lat, mc.lon], 15, { duration: 0.75 });
    const marker = markers.current.get(mc.id);
    if (marker && clusterGroup.current) {
      clusterGroup.current.zoomToShowLayer(marker, () => marker.openPopup());
    }
  };

  // Focus requested externally (e.g. "il più vicino" from Home)
  useEffect(() => {
    if (!mapFocusId || !map.current) return;
    const mc = mcdonalds.find(m => m.id === mapFocusId);
    const marker = markers.current.get(mapFocusId);
    if (mc && marker && clusterGroup.current) {
      map.current.flyTo([mc.lat, mc.lon], 15, { duration: 0.75 });
      clusterGroup.current.zoomToShowLayer(marker, () => marker.openPopup());
    }
    clearMapFocus();
  }, [mapFocusId, mcdonalds, clearMapFocus]);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="absolute top-3 left-3 right-3 z-[1000]">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca un McDonald's sulla mappa..."
            className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-md focus:outline-none focus:ring-2 focus:ring-mc-red font-medium"
          />
        </div>
        {results.length > 0 && (
          <div className="mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md overflow-hidden">
            {results.map(mc => (
              <button
                key={mc.id}
                onClick={() => selectResult(mc)}
                className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <span className="font-display font-semibold text-gray-800 dark:text-gray-100">{mc.name}</span>
                <span className="text-gray-500 dark:text-gray-400"> · {mc.city}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div ref={mapContainer} className={`w-full h-full ${isDark ? 'map-dark' : ''}`} />
    </div>
  );
}
