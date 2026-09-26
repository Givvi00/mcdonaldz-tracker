// The card to share (WhatsApp, Instagram…): your count, level, verified visits, regions and Italy coloured by them,
// drawn on a canvas as a 1080 × 1350 picture (the 4:5 shape social apps show whole). The app's own fonts are used
// (they are already loaded by the page); nothing leaves the phone until you choose where to send it.
import { ITALY_MAP, MAP_REGIONS } from '@/data/italyMap';
import { TIER_FILL } from '@/utils/regionColors';
import type { RegionTier } from '@/services/regions';

export interface CardData {
  username?: string;
  visited: number;
  total: number;
  verified: number;
  level: number;
  levelName: string;
  goldRegions: number;
  diamondRegions: number;
  stamps: number;
  tiers: Record<string, RegionTier>;
}

const W = 1080;
const H = 1350;
const RED = '#DA291C';
const RED_DARK = '#A8180D';
const YELLOW = '#FFC72C';
const INK = '#3B2A22';
const DISPLAY = 'Fredoka, system-ui, sans-serif';
const TEXT = 'Inter, system-ui, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** The blue seal of verified visits, simplified for the picture */
function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.86;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, '#4FB3FF');
  g.addColorStop(1, '#1570D8');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.38, y + r * 0.02);
  ctx.lineTo(x - r * 0.1, y + r * 0.3);
  ctx.lineTo(x + r * 0.42, y - r * 0.28);
  ctx.stroke();
  ctx.restore();
}

/** A few soft rings over the red, the way the app's cards have a pattern behind */
function drawBackground(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, RED);
  g.addColorStop(1, RED_DARK);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 26;
  for (const [x, y, r] of [
    [980, 120, 170],
    [90, 560, 120],
    [1010, 760, 90],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export async function drawShareCard(data: CardData): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');

  drawBackground(ctx);

  // Header: icon, name of the app, who
  const icon = await loadImage(`${import.meta.env.BASE_URL}icons/icon-192.png`);
  if (icon) {
    ctx.save();
    roundRect(ctx, 72, 72, 112, 112, 30);
    ctx.clip();
    ctx.drawImage(icon, 72, 72, 112, 112);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 6;
    roundRect(ctx, 72, 72, 112, 112, 30);
    ctx.stroke();
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 60px ${DISPLAY}`;
  ctx.fillText('McDonaldz', 214, 140);
  if (data.username) {
    ctx.globalAlpha = 0.85;
    ctx.font = `600 34px ${TEXT}`;
    ctx.fillText(`@${data.username}`, 216, 184);
    ctx.globalAlpha = 1;
  }

  // The count
  ctx.textAlign = 'center';
  ctx.font = `700 250px ${DISPLAY}`;
  ctx.fillText(String(data.visited), W / 2, 470);
  ctx.globalAlpha = 0.92;
  ctx.font = `600 44px ${DISPLAY}`;
  ctx.fillText(`McDonald's visitati su ${data.total}`, W / 2, 545);
  ctx.globalAlpha = 1;

  // Progress bar
  const pct = data.total > 0 ? Math.min(1, data.visited / data.total) : 0;
  const barX = 140;
  const barW = W - 280 - 130;
  roundRect(ctx, barX, 600, barW, 32, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  if (pct > 0) {
    roundRect(ctx, barX, 600, Math.max(32, barW * pct), 32, 16);
    ctx.fillStyle = YELLOW;
    ctx.fill();
  }
  ctx.textAlign = 'right';
  ctx.font = `700 44px ${DISPLAY}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${Math.round(pct * 100)}%`, W - 140, 632);

  // Panel: Italy on the left, the numbers on the right
  const px = 60;
  const py = 730;
  const pw = W - 120;
  const ph = 520;
  roundRect(ctx, px, py, pw, ph, 44);
  ctx.fillStyle = '#FFF9F0';
  ctx.fill();

  const scale = 1.3;
  const mapW = ITALY_MAP.width * scale;
  const mapH = ITALY_MAP.height * scale;
  ctx.save();
  ctx.translate(px + 40, py + (ph - mapH) / 2);
  ctx.scale(scale, scale);
  for (const [name, region] of Object.entries(MAP_REGIONS)) {
    const path = new Path2D(region.path);
    ctx.fillStyle = TIER_FILL[data.tiers[name] ?? 'empty'];
    ctx.fill(path);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 0.9;
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }
  ctx.restore();

  const rows: Array<{ value: string; label: string; mark?: 'seal' | string }> = [
    { value: `Livello ${data.level}`, label: data.levelName },
    { value: String(data.verified), label: data.verified === 1 ? 'visita verificata' : 'visite verificate', mark: 'seal' },
    { value: String(data.goldRegions), label: data.goldRegions === 1 ? "regione d'oro" : "regioni d'oro", mark: TIER_FILL.gold },
    {
      value: String(data.diamondRegions),
      label: data.diamondRegions === 1 ? 'regione di diamante' : 'regioni di diamante',
      mark: TIER_FILL.diamond,
    },
    { value: String(data.stamps), label: data.stamps === 1 ? 'timbro' : 'timbri' },
  ];
  const colX = px + 40 + mapW + 40;
  const rowH = 88;
  const top = py + (ph - rows.length * rowH) / 2 + 52;
  ctx.textAlign = 'left';
  rows.forEach((row, i) => {
    const y = top + i * rowH;
    let x = colX;
    if (row.mark === 'seal') {
      drawSeal(ctx, x + 20, y - 18, 20);
      x += 52;
    } else if (row.mark) {
      ctx.beginPath();
      ctx.arc(x + 20, y - 18, 17, 0, Math.PI * 2);
      ctx.fillStyle = row.mark;
      ctx.fill();
      ctx.strokeStyle = 'rgba(59,42,34,0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
      x += 52;
    }
    ctx.fillStyle = INK;
    ctx.font = `700 46px ${DISPLAY}`;
    ctx.fillText(row.value, x, y);
    ctx.fillStyle = '#7A6A5C';
    ctx.font = `500 26px ${TEXT}`;
    ctx.fillText(row.label, colX, y + 34, px + pw - colX - 30);
  });

  // Where to find it
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `600 28px ${TEXT}`;
  ctx.fillText('Collezionali tutti su McDonaldz 🍔', W / 2, H - 40);

  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('png'))), 'image/png'));
}

/**
 * Hands the picture to the phone's share sheet (WhatsApp, Instagram, save to photos…); where sharing files is not
 * possible (a computer), it is downloaded instead. Resolves to false when the share sheet is dismissed.
 */
export async function shareCard(data: CardData): Promise<boolean> {
  const blob = await drawShareCard(data);
  const file = new File([blob], 'mcdonaldz.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `Sono a ${data.visited} McDonald's su ${data.total}! 🍔` });
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') return false;
      throw error;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mcdonaldz.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
