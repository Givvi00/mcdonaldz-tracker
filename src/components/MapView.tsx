import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { StatusFilter } from '@/components/StatusFilter';
import { FoodIcon } from '@/components/FoodIcon';
import { levelInfo } from '@/utils/foodTheme';
import { countedMcdonalds } from '@/utils/catalog';
import { markerBackground, markerSymbol, popupHtml } from '@/utils/mapMarkers';
import { VisitDateSheet } from '@/components/VisitDateSheet';
import { openDirections } from '@/utils/navigation';
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
  const userMarker = useRef<L.Marker | null>(null);
  const { mcdonalds, visits, isVisited, toggleVisit, changeVisitDate, mapFocusId, clearMapFocus, userPosition, setSelectedTab, getVisitedCount } = useMcdonaldStore();
  const [query, setQuery] = useState('');
  const [dateFor, setDateFor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const results = useMemo<McDonald[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return countedMcdonalds(mcdonalds, visits)
      .filter(mc => mc.name.toLowerCase().includes(q) || mc.city.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, mcdonalds, visits]);

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
      // A closed restaurant only stays on the map if you visited it
      if (!mc.opened && !visited) return;
      if (statusFilter !== null && visited !== statusFilter) return;
      const icon = L.divIcon({
        html: `
          <div style="
            background: ${markerBackground(mc, visited)};
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
            ${markerSymbol(mc, visited)}
          </div>
        `,
        iconSize: [30, 30],
        className: '',
      });

      const marker = L.marker([mc.lat, mc.lon], { icon, mcVisited: visited } as L.MarkerOptions);
      marker.bindPopup(popupHtml(mc, visited, visits.find(v => v.mcdonaldId === mc.id)?.visitedAt));

      marker.on('popupopen', () => {
        const btn = document.getElementById(`toggle-${mc.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            toggleVisit(mc.id);
          };
        }
        const dateBtn = document.getElementById(`date-${mc.id}`);
        if (dateBtn) {
          dateBtn.onclick = e => {
            e.preventDefault();
            setDateFor(mc.id);
          };
        }
        const directionsBtn = document.getElementById(`directions-${mc.id}`);
        if (directionsBtn) {
          directionsBtn.onclick = (e) => {
            e.preventDefault();
            openDirections(mc);
          };
        }
      });

      markers.current.set(mc.id, marker);
      clusterGroup.current!.addLayer(marker);
    });
  }, [mcdonalds, visits, isVisited, toggleVisit, statusFilter]);

  // User position marker (outside the cluster group so it is always visible)
  useEffect(() => {
    if (!map.current) return;

    if (!userPosition) {
      userMarker.current?.remove();
      userMarker.current = null;
      return;
    }

    const latlng: L.LatLngExpression = [userPosition.lat, userPosition.lon];
    if (userMarker.current) {
      userMarker.current.setLatLng(latlng);
      return;
    }

    const icon = L.divIcon({
      html: `
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid white;
          box-shadow: 0 0 0 6px rgba(37,99,235,0.25), 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [18, 18],
      className: '',
    });
    userMarker.current = L.marker(latlng, { icon, zIndexOffset: 1000, keyboard: false })
      .bindTooltip('Tu sei qui', { direction: 'top', offset: [0, -10] })
      .addTo(map.current);
  }, [userPosition]);

  const centerOnUser = () => {
    if (userPosition) {
      map.current?.flyTo([userPosition.lat, userPosition.lon], 14, { duration: 0.75 });
    }
  };

  /**
   * Centre the map on a restaurant and open its popup. Jump straight there (a flight and the cluster's own zoom used to
   * fight each other and left the map somewhere else), let the cluster reveal the marker, then centre on it again: a bit
   * lower than the middle of the screen, so the popup above it fits in view too.
   */
  const focusMarker = (mc: McDonald, marker: L.Marker) => {
    const m = map.current;
    const cluster = clusterGroup.current;
    if (!m || !cluster) return;
    m.invalidateSize();
    m.setView([mc.lat, mc.lon], 16, { animate: false });
    cluster.zoomToShowLayer(marker, () => {
      const zoom = m.getZoom();
      const point = m.project(marker.getLatLng(), zoom);
      point.y -= 70;
      m.setView(m.unproject(point, zoom), zoom, { animate: false });
      marker.openPopup();
    });
  };

  const selectResult = (mc: McDonald) => {
    setQuery('');
    const marker = markers.current.get(mc.id);
    if (marker && clusterGroup.current) {
      focusMarker(mc, marker);
    } else {
      // Hidden by the status filter: show everything again so the marker exists
      setStatusFilter(null);
    }
  };

  // Focus requested externally (e.g. "il più vicino" from Home)
  useEffect(() => {
    if (!mapFocusId || !map.current) return;
    const mc = mcdonalds.find(m => m.id === mapFocusId);
    const marker = markers.current.get(mapFocusId);
    if (mc && !marker && statusFilter !== null) {
      // Hidden by the status filter: reset it and retry once the markers are rebuilt
      setStatusFilter(null);
      return;
    }
    if (mc && marker && clusterGroup.current) focusMarker(mc, marker);
    clearMapFocus();
  }, [mapFocusId, mcdonalds, clearMapFocus, statusFilter]);

  return (
    <div className="relative w-full" style={{ height: '100%' }}>
      <div className="absolute left-3 right-3 z-[1000]" style={{ top: 'calc(0.75rem + var(--safe-top))' }}>
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
        <StatusFilter value={statusFilter} onChange={setStatusFilter} className="mt-2 shadow-md" />
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
      {dateFor && visits.find(v => v.mcdonaldId === dateFor) && (
        <VisitDateSheet
          name={mcdonalds.find(m => m.id === dateFor)?.name ?? ''}
          visitedAt={visits.find(v => v.mcdonaldId === dateFor)!.visitedAt}
          onSave={ms => void changeVisitDate(dateFor, ms)}
          onClose={() => setDateFor(null)}
        />
      )}
      <div ref={mapContainer} className={`w-full h-full ${isDark ? 'map-dark' : ''}`} />
      <button
        onClick={() => setSelectedTab('profile')}
        aria-label="Apri il profilo"
        className={`absolute right-2.5 z-[1000] flex h-12 w-12 items-center justify-center rounded-full border-2 border-mc-red bg-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform active:scale-95 dark:bg-gray-900 ${
          userPosition ? 'bottom-48' : 'bottom-28'
        }`}
      >
        <FoodIcon name={levelInfo(getVisitedCount()).level.icon} size={30} />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-mc-red px-1 text-[0.65rem] font-black text-white ring-2 ring-white dark:ring-gray-900">
          {levelInfo(getVisitedCount()).number}
        </span>
      </button>
      {userPosition && (
        <button
          onClick={centerOnUser}
          aria-label="Centra sulla mia posizione"
          className="absolute bottom-28 right-2.5 z-[1000] w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 border-2 border-[#3B2A22] dark:border-gray-500 shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-2xl active:scale-95 transition-transform"
        >
          🎯
        </button>
      )}
    </div>
  );
}
