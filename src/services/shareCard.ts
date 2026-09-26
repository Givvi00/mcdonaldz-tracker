// The card to share (WhatsApp, Instagram…): your visits as a McDonald's till receipt, like the one in Stats. One line
// per region (visited, verified, total, and a mark for gold and diamond ones), the total, level and stamps, a barcode.
// Drawn on a canvas as a 1080 × 1350 picture (the 4:5 shape social apps show whole); nothing leaves the phone until
// you choose where to send it.
import type { RegionTier } from '@/services/regions';

export interface CardRegion {
  region: string;
  visited: number;
  verified: number;
  total: number;
  tier: RegionTier;
}

export interface CardData {
  username?: string;
  visited: number;
  total: number;
  verified: number;
  level: number;
  levelName: string;
  stamps: number;
  regions: CardRegion[];
}

const W = 1080;
const H = 1350;
const RED = '#DA291C';
const RED_DARK = '#A8180D';
const INK = '#2B2420';
const FADED = '#8A7F76';
const GREEN = '#15803D';
const BLUE = '#1D4ED8';
const GOLD = '#D9A21B';
const DIAMOND = '#3AA7E8';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Roboto Mono", "Courier New", monospace';
const DISPLAY = 'Fredoka, system-ui, sans-serif';

/** The paper */
const PAPER_W = 760;
const PAD = 44;
const LINE = 42;
const TOOTH = 14;
/** Regions shown one by one; the rest are summed on one line */
const MAX_LINES = 12;

/** Right edges of the three number columns: visited, verified, total */
const COLS = [PAPER_W - PAD - 176, PAPER_W - PAD - 88, PAPER_W - PAD];

function font(size: number, weight = 400) {
  return `${weight} ${size}px ${MONO}`;
}

/** A barcode that is always the same for the same person and count (it only looks like one) */
function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: string) {
  let n = 0;
  for (const c of seed) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  const next = () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 2 ** 32;
  };
  ctx.fillStyle = INK;
  let at = x;
  while (at < x + w) {
    const bar = 2 + Math.floor(next() * 4) * 2;
    if (at + bar > x + w) break;
    ctx.fillRect(at, y, bar, h);
    at += bar + 2 + Math.floor(next() * 3) * 2;
  }
}

/** The paper's outline: straight sides, zigzag top and bottom, as if torn off the till */
function paperPath(ctx: CanvasRenderingContext2D, height: number) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x < PAPER_W; x += TOOTH * 2) {
    ctx.lineTo(x + TOOTH, -TOOTH);
    ctx.lineTo(Math.min(PAPER_W, x + TOOTH * 2), 0);
  }
  ctx.lineTo(PAPER_W, height);
  for (let x = PAPER_W; x > 0; x -= TOOTH * 2) {
    ctx.lineTo(x - TOOTH, height + TOOTH);
    ctx.lineTo(Math.max(0, x - TOOTH * 2), height);
  }
  ctx.closePath();
}

/** The two column heads, drawn as in the app: a green tick for visited, the blue seal for verified */
function drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#16A34A';
  ctx.fill();
  checkMark(ctx, x, y, r);
}

function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
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
  checkMark(ctx, x, y, r);
}

function checkMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.4, y + r * 0.02);
  ctx.lineTo(x - r * 0.1, y + r * 0.32);
  ctx.lineTo(x + r * 0.42, y - r * 0.28);
  ctx.stroke();
  ctx.restore();
}

function dashed(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save();
  ctx.strokeStyle = '#CFC6BC';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 9]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(PAPER_W - PAD, y);
  ctx.stroke();
  ctx.restore();
}

function center(ctx: CanvasRenderingContext2D, text: string, y: number, size: number, weight = 400, color = INK) {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, PAPER_W / 2, y);
}

/** Region name, dotted leader, then the three numbers; a mark after the name for gold (★) and diamond (◆) regions */
function row(ctx: CanvasRenderingContext2D, y: number, name: string, nums: [string, string, string], opts: { bold?: boolean; mark?: RegionTier } = {}) {
  ctx.font = font(opts.bold ? 30 : 28, opts.bold ? 700 : 400);
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  const maxName = COLS[0] - PAD - 90;
  let label = name;
  while (ctx.measureText(label).width > maxName && label.length > 4) label = label.slice(0, -2) + '…';
  ctx.fillText(label, PAD, y);
  let end = PAD + ctx.measureText(label).width;
  if (opts.mark === 'gold' || opts.mark === 'diamond') {
    const mark = opts.mark === 'gold' ? ' ★' : ' ◆';
    ctx.fillStyle = opts.mark === 'gold' ? GOLD : DIAMOND;
    ctx.fillText(mark, end, y);
    end += ctx.measureText(mark).width;
  }
  const firstNum = COLS[0] - ctx.measureText(nums[0]).width - 14;
  ctx.fillStyle = '#B9AFA5';
  for (let x = end + 14; x < firstNum; x += 12) ctx.fillRect(x, y - 7, 3, 3);
  ctx.textAlign = 'right';
  ctx.fillStyle = GREEN;
  ctx.fillText(nums[0], COLS[0], y);
  ctx.fillStyle = BLUE;
  ctx.fillText(nums[1], COLS[1], y);
  ctx.fillStyle = INK;
  ctx.fillText(nums[2], COLS[2], y);
}

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
    [990, 110, 170],
    [70, 700, 130],
    [1000, 1180, 110],
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

  // What goes on the paper: regions with at least one visit, most visited first
  const visited = data.regions
    .filter(r => r.visited > 0)
    .sort((a, b) => b.visited - a.visited || a.region.localeCompare(b.region, 'it'));
  const shown = visited.length > MAX_LINES ? visited.slice(0, MAX_LINES - 1) : visited;
  const rest = visited.slice(shown.length);
  const lines = Math.max(1, shown.length + (rest.length > 0 ? 1 : 0));
  const paperH = 290 + lines * LINE + 360;

  // The paper, slightly turned, with its shadow
  ctx.save();
  ctx.translate(W / 2, (H - 70) / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.translate(-PAPER_W / 2, -paperH / 2);
  ctx.shadowColor = 'rgba(40,10,5,0.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FFFFFF';
  paperPath(ctx, paperH);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Header
  let y = PAD + 40;
  center(ctx, 'McDONALDZ', y, 50, 700);
  y += 46;
  center(ctx, data.username ? `Benvenuto al McDrive, ${data.username}` : 'Benvenuto al McDrive', y, 24);
  y += 40;
  center(ctx, 'RISTORANTI VISITATI', y, 26, 700);
  y += 36;
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  center(ctx, `Ordine n. ${data.visited} · ${today}`, y, 22, 400, FADED);
  y += 32;
  dashed(ctx, y);
  y += 44;

  // Column heads
  ctx.font = font(20, 700);
  ctx.textAlign = 'left';
  ctx.fillStyle = FADED;
  ctx.fillText('REGIONE', PAD, y);
  ctx.textAlign = 'right';
  // Centred over the right-aligned numbers (about two digits wide)
  drawTick(ctx, COLS[0] - 17, y - 8, 14);
  drawSeal(ctx, COLS[1] - 17, y - 8, 16);
  ctx.fillStyle = FADED;
  ctx.fillText('TOT', COLS[2], y);
  y += LINE;

  if (shown.length === 0) {
    center(ctx, 'Nessun articolo. Ordina il primo!', y, 26, 400, FADED);
    y += LINE;
  }
  for (const r of shown) {
    row(ctx, y, r.region, [String(r.visited), r.verified ? String(r.verified) : '·', String(r.total)], { mark: r.tier });
    y += LINE;
  }
  if (rest.length > 0) {
    const sum = (k: 'visited' | 'verified' | 'total') => rest.reduce((n, r) => n + r[k], 0);
    row(ctx, y, `Altre ${rest.length} regioni`, [String(sum('visited')), sum('verified') ? String(sum('verified')) : '·', String(sum('total'))]);
    y += LINE;
  }

  y -= 10;
  dashed(ctx, y);
  y += 48;
  row(ctx, y, 'TOTALE', [String(data.visited), data.verified ? String(data.verified) : '·', String(data.total)], { bold: true });
  y += 52;
  const pct = data.total > 0 ? Math.round((data.visited / data.total) * 100) : 0;
  ctx.font = font(24);
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText(`LIVELLO ${data.level} · ${data.levelName.toUpperCase()}`, PAD, y);
  y += 36;
  ctx.fillText(`TIMBRI ${data.stamps}`, PAD, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${pct}% D'ITALIA`, PAPER_W - PAD, y);
  y += 30;
  dashed(ctx, y);
  y += 28;
  drawBarcode(ctx, PAD + 70, y, PAPER_W - 2 * PAD - 140, 72, `${data.username ?? ''}${data.visited}`);
  y += 112;
  center(ctx, 'Grazie e a presto!', y, 24, 400, FADED);
  ctx.restore();

  // Below the paper
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `600 32px ${DISPLAY}`;
  ctx.fillText('McDonaldz · collezionali tutti 🍔', W / 2, H - 40);

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
