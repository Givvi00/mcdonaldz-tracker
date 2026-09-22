import type { McDonald } from '@shared/types';
import { foodIconSvg, restaurantKind } from '@/utils/foodTheme';
import { RING_PATH } from '@/components/VerifiedBadge';

/** A small "verified" seal, still (no spin, to stay light with many markers on screen), for the map pin and popup */
export function verifiedSealMarkup(id: string, size = 22): string {
  const gid = `vseal-${id}`;
  return `
    <svg viewBox="0 0 40 40" width="${size}" height="${size}" style="display:block;">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#9DCCFF" />
          <stop offset="0.5" stop-color="#3B82F6" />
          <stop offset="1" stop-color="#1541A8" />
        </linearGradient>
      </defs>
      <path d="${RING_PATH}" fill="url(#${gid})" stroke="#0C2A66" stroke-width="0.8" stroke-linejoin="round" />
      <circle cx="20" cy="20" r="15" fill="url(#${gid})" stroke="#fff" stroke-width="2" />
      <path d="M11.19,12.61 A11.5,11.5 0 0 1 28.81,12.61" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.8" stroke-linecap="round" />
      <path d="M14 20.3L18 24.3L26.5 15" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pillButton = (background: string, color: string) => `
              padding: 6px 12px;
              background: ${background};
              color: ${color};
              border: none;
              border-radius: 999px;
              cursor: pointer;
              font-weight: 600;
              font-family: 'Fredoka', sans-serif;
              font-size: 12px;
            `;

/** Marker colour: grey for a closed restaurant you visited, green for visited, red for still to visit */
export function markerBackground(mc: McDonald, visited: boolean): string {
  if (!mc.opened) return 'linear-gradient(135deg, #a8a29e, #78716c)';
  return visited
    ? 'linear-gradient(135deg, #4ade80, #16a34a)'
    : 'linear-gradient(135deg, #DA291C, #a8180d)';
}

/** What the marker shows: a tick once visited, nothing otherwise (the colour says the rest) */
export function markerSymbol(_mc: McDonald, visited: boolean): string {
  return visited ? '✓' : '';
}

/** Content of the map popup. A closed restaurant shows a "Chiuso" badge and no directions button. */
export function popupHtml(mc: McDonald, visited: boolean, visitedAt?: number, verified?: boolean, canVerify = false): string {
  const formattedDate = visitedAt ? new Date(visitedAt).toLocaleDateString('it-IT', { dateStyle: 'medium' }) : '';
  // A verified visit is locked (no "Cambia"): the date is the phone's own proof of when you were there
  const visitDate =
    visited && visitedAt
      ? verified
        ? `<span style="display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; padding: 3px 10px 3px 5px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 600;">${verifiedSealMarkup(`popup-${mc.id}`, 15)}Visitato il ${formattedDate}</span><br/>`
        : `<button id="date-${mc.id}" style="margin-top: 6px; padding: 3px 9px; border: none; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 600; cursor: pointer;">📅 Visitato il ${formattedDate} · Cambia</button><br/>`
      : '';
  const closedBadge = mc.opened
    ? ''
    : `<span style="display: inline-block; margin-top: 4px; padding: 2px 8px; border-radius: 999px; background: #78716c; color: white; font-size: 11px; font-weight: 600;">Chiuso${mc.closedAt ? ` dal ${escapeHtml(mc.closedAt)}` : ''}</span>`;
  const kind = restaurantKind(mc);
  const kindBadge = kind ? `${kind.emoji} ` : '';
  const directions = mc.opened
    ? `<button id="directions-${mc.id}" style="${pillButton('#FFC72C', '#2f2522')}">
              🧭 Portami lì
            </button>`
    : '';

  return `
        <div style="font-size: 13px; min-width: 160px;">
          <strong style="font-family: 'Fredoka', sans-serif; font-size: 14px;">${kindBadge}${escapeHtml(mc.name)}</strong><br/>
          <span style="color: #6b7280;">${escapeHtml(mc.city)}, ${escapeHtml(mc.region)}</span><br/>
          ${closedBadge}
          ${visitDate}
          ${
            canVerify
              ? `<button id="verify-${mc.id}" style="margin-top: 6px; padding: 3px 10px; border: 1px solid #60a5fa; border-radius: 999px; background: white; color: #1d4ed8; font-size: 11px; font-weight: 600; cursor: pointer;">📍 Verifica ora</button><br/>`
              : ''
          }
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button id="toggle-${mc.id}" style="${pillButton(visited ? '#16a34a' : '#DA291C', 'white')}">
              ${visited ? '✓ Visitato' : `${foodIconSvg('fries', 15)} Segna visita`}
            </button>
            ${directions}
          </div>
        </div>
      `;
}
