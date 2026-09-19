import type { McDonald } from '@shared/types';
import { markerEmoji, restaurantKind } from '@/utils/foodTheme';

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

/** What the marker shows: a tick once visited, otherwise a food emoji that stays the same for this restaurant */
export function markerSymbol(mc: McDonald, visited: boolean): string {
  return visited ? '✓' : markerEmoji(mc.id);
}

/** Content of the map popup. A closed restaurant shows a "Chiuso" badge and no directions button. */
export function popupHtml(mc: McDonald, visited: boolean): string {
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
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button id="toggle-${mc.id}" style="${pillButton(visited ? '#16a34a' : '#DA291C', 'white')}">
              ${visited ? '✓ Visitato' : '🍟 Segna visita'}
            </button>
            ${directions}
          </div>
        </div>
      `;
}
