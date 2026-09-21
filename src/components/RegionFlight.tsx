import { useMemo } from 'react';
import { ITALY_MAP, MAP_REGIONS } from '@/data/italyMap';
import { ItalyMap, TIER_FILL } from '@/components/ItalyMap';
import type { RegionTier } from '@/services/regions';

/** How long the return of the region to the map takes at the end, and the pause after it (seconds) */
export const FLIGHT_BACK = 0.9;
export const FLIGHT_END = 1.4;

const GOLD = TIER_FILL.gold;
const EASE = 'cubic-bezier(0.5, 0, 0.2, 1)';

/**
 * A completed region leaves Italy: the map appears, the region lights up, lifts off, flies to the centre growing (where the
 * popup takes over) and, when the popup is done, comes back gold to its place. The whole thing is one timeline of
 * `total` seconds; `returnAt` is when the region starts flying back. Only opacity and transforms are animated.
 */
export function RegionFlight({ region, tiers, returnAt, total }: { region: string; tiers: Record<string, RegionTier>; returnAt: number; total: number }) {
  const shape = MAP_REGIONS[region];
  const css = useMemo(() => {
    if (!shape) return '';
    const p = (t: number) => `${((Math.min(t, total) / total) * 100).toFixed(2)}%`;
    const dx = ITALY_MAP.width / 2 - shape.cx;
    const dy = ITALY_MAP.height / 2 - shape.cy;
    const s = Math.min(5, (ITALY_MAP.width * 0.62) / shape.w, (ITALY_MAP.height * 0.5) / shape.h);
    const R = returnAt;
    const away = `translate(${dx}px, ${dy}px) scale(${s.toFixed(2)})`;
    const home = 'translate(0px, 0px) scale(1)';
    const start = TIER_FILL.progress;
    return `
@keyframes rf-map { 0% { opacity: 0 } ${p(0.4)} { opacity: 1 } ${p(2)} { opacity: 1 } ${p(2.6)} { opacity: .25 } ${p(R - 0.4)} { opacity: .25 } ${p(R)} { opacity: 1 } ${p(R + FLIGHT_BACK + 0.1)} { opacity: 1 } 100% { opacity: 0 } }
@keyframes rf-fly { 0% { transform: ${home} } ${p(1.0)} { transform: ${home}; animation-timing-function: ${EASE} } ${p(2)} { transform: ${away} } ${p(R)} { transform: ${away}; animation-timing-function: ${EASE} } ${p(R + FLIGHT_BACK)} { transform: ${home} } 100% { transform: ${home} } }
@keyframes rf-fill { 0% { fill: ${start} } ${p(0.5)} { fill: ${start} } ${p(0.9)} { fill: ${GOLD} } 100% { fill: ${GOLD} } }
@keyframes rf-inner { 0% { opacity: 1 } ${p(2.3)} { opacity: 1 } ${p(2.6)} { opacity: 0 } ${p(R - 0.05)} { opacity: 0 } ${p(R)} { opacity: 1 } 100% { opacity: 1 } }
@keyframes rf-hole { 0% { fill: ${start} } ${p(1.0)} { fill: ${start} } ${p(1.3)} { fill: rgba(255,255,255,0) } ${p(R + FLIGHT_BACK - 0.2)} { fill: rgba(255,255,255,0) } ${p(R + FLIGHT_BACK)} { fill: ${GOLD} } 100% { fill: ${GOLD} } }
`;
  }, [shape, returnAt, total]);

  if (!shape) return null;
  const others = { ...tiers, [region]: 'progress' as RegionTier };
  const run = (name: string) => `${name} ${total}s linear both`;

  return (
    <div
      className="absolute"
      style={{ left: '50%', top: '44%', width: 'min(80vw, 50vh)', aspectRatio: `${ITALY_MAP.width} / ${ITALY_MAP.height}`, transform: 'translate(-50%, -50%)' }}
    >
      <style>{css}</style>
      <div style={{ width: '100%', height: '100%', animation: run('rf-map') }}>
        <ItalyMap tiers={others} skip={region} className="h-full w-full">
          {/* the hole it leaves: empty while the region is away */}
          <path d={shape.path} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={0.8} strokeLinejoin="round" style={{ animation: run('rf-hole') }} />
          <g style={{ transformOrigin: `${shape.cx}px ${shape.cy}px`, animation: run('rf-fly') }}>
            <g style={{ animation: run('rf-inner') }}>
              <path d={shape.path} fill="none" stroke="#FFF3B0" strokeOpacity={0.55} strokeWidth={9} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={shape.path} stroke="#8A5A00" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ animation: run('rf-fill') }} />
            </g>
          </g>
        </ItalyMap>
      </div>
    </div>
  );
}
