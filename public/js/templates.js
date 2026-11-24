/**
 * The fixed ad designs.
 *
 * The model (or the era filter) produces the photograph; everything else on
 * the poster - paper, headline, logo lockup, plaque - is drawn here, so the
 * brand layout never depends on what an image model decides to render.
 */
import { drawCover } from './filters.js';

export const POSTER_W = 1080;
export const POSTER_H = 1350;

const SERIF = '"Playfair Display", Georgia, serif';
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/* ------------------------------------------------------------------ utils */

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Letter-spaced text, drawn by hand so it behaves the same everywhere. */
function tracked(ctx, text, x, y, spacing = 0, align = 'left') {
  const chars = [...String(text)];
  const width =
    chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
    spacing * Math.max(0, chars.length - 1);
  let cursor = x;
  if (align === 'center') cursor = x - width / 2;
  if (align === 'right') cursor = x - width;
  for (const ch of chars) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
  return width;
}

function trackedWidth(ctx, text, spacing = 0) {
  const chars = [...String(text)];
  return (
    chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
    spacing * Math.max(0, chars.length - 1)
  );
}

/** Draw a \n separated headline, auto-shrinking to fit a max width. */
function headline(ctx, text, { x, y, maxWidth, size, lineHeight, font, align = 'center' }) {
  const lines = String(text).split('\n');
  let fontSize = size;
  for (let guard = 0; guard < 40; guard += 1) {
    ctx.font = font.replace('{size}', `${fontSize}px`);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth || fontSize <= 18) break;
    fontSize -= 2;
  }
  ctx.textAlign = align;
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * fontSize * lineHeight);
  });
  return y + (lines.length - 1) * fontSize * lineHeight;
}

function paperGrain(ctx, x, y, w, h, alpha = 0.035) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < (w * h) / 900; i += 1) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
    ctx.fillRect(px, py, 1.4, 1.4);
  }
  ctx.restore();
}

function shadow(ctx, blur, yOffset, color = 'rgba(0,0,0,0.3)') {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = yOffset;
}

function clearShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function plaqueText(year, community) {
  const place = (community || '').trim();
  return place ? `HOME SINCE ${year} · ${place.toUpperCase()}` : `HOME SINCE ${year}`;
}

/* -------------------------------------------------------------- templates */

function classified(ctx, { photo, era, year, community }) {
  const p = era.palette;
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  paperGrain(ctx, 0, 0, POSTER_W, POSTER_H, 0.05);

  const M = 86;
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(M - 20, M - 20, POSTER_W - (M - 20) * 2, POSTER_H - (M - 20) * 2);
  ctx.lineWidth = 1;
  ctx.strokeRect(M - 12, M - 12, POSTER_W - (M - 12) * 2, POSTER_H - (M - 12) * 2);

  // masthead
  ctx.fillStyle = p.muted;
  ctx.font = `600 22px ${MONO}`;
  ctx.textAlign = 'left';
  tracked(ctx, era.kicker, M, M + 36, 5);
  ctx.textAlign = 'right';
  ctx.fillStyle = p.muted;
  tracked(ctx, `DUBAI · ${era.adYear}`, POSTER_W - M, M + 36, 5, 'right');

  ctx.fillStyle = p.ink;
  ctx.fillRect(M, M + 56, POSTER_W - M * 2, 2);

  // headline
  ctx.fillStyle = p.ink;
  ctx.textAlign = 'center';
  headline(ctx, era.headline, {
    x: POSTER_W / 2,
    y: M + 160,
    maxWidth: POSTER_W - M * 2,
    size: 84,
    lineHeight: 1.05,
    font: `700 {size} ${SERIF}`,
  });

  ctx.fillStyle = p.accent;
  ctx.fillRect(POSTER_W / 2 - 60, M + 196, 120, 3);

  // halftoned photo in a hairline box
  const box = { x: M + 40, y: M + 244, w: POSTER_W - (M + 40) * 2, h: 572 };
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  drawCover(ctx, photo, box.x, box.y, box.w, box.h, 0.3);
  ctx.restore();
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  // caption + body
  ctx.fillStyle = p.muted;
  ctx.font = `400 22px ${MONO}`;
  ctx.textAlign = 'center';
  tracked(ctx, `FIG. 1 — ${(community || 'DUBAI').toUpperCase()}`, POSTER_W / 2, box.y + box.h + 42, 3, 'center');

  ctx.fillStyle = p.ink;
  ctx.font = `400 29px ${SERIF}`;
  era.body.forEach((line, i) => {
    ctx.fillText(line, POSTER_W / 2, box.y + box.h + 94 + i * 40);
  });

  // plaque
  const plaque = plaqueText(year, community);
  ctx.font = `600 24px ${MONO}`;
  const pw = trackedWidth(ctx, plaque, 4) + 56;
  const px = (POSTER_W - pw) / 2;
  const py = POSTER_H - M - 118;
  ctx.fillStyle = p.ink;
  ctx.fillRect(px, py, pw, 58);
  ctx.fillStyle = p.paper;
  tracked(ctx, plaque, POSTER_W / 2, py + 37, 4, 'center');

  ctx.fillStyle = p.ink;
  ctx.fillRect(M, POSTER_H - M - 44, POSTER_W - M * 2, 2);
  ctx.fillStyle = p.muted;
  ctx.font = `400 22px ${MONO}`;
  tracked(ctx, era.signoff, POSTER_W / 2, POSTER_H - M - 12, 4, 'center');
}

function brochure(ctx, { photo, era, year, community }) {
  const p = era.palette;
  const bg = ctx.createLinearGradient(0, 0, 0, POSTER_H);
  bg.addColorStop(0, '#11474d');
  bg.addColorStop(1, '#09272c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  const M = 70;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(M, M, POSTER_W - M * 2, POSTER_H - M * 2);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(M + 10, M + 10, POSTER_W - (M + 10) * 2, POSTER_H - (M + 10) * 2);
  ctx.globalAlpha = 1;

  ctx.fillStyle = p.accent;
  ctx.font = `600 22px ${MONO}`;
  ctx.textAlign = 'center';
  tracked(ctx, era.kicker, POSTER_W / 2, M + 66, 7, 'center');

  // glossy photo with a white print border
  const box = { x: M + 72, y: M + 110, w: POSTER_W - (M + 72) * 2, h: 600 };
  ctx.save();
  shadow(ctx, 40, 18, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = '#fdfaf2';
  ctx.fillRect(box.x - 16, box.y - 16, box.w + 32, box.h + 32);
  ctx.restore();
  clearShadow(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  drawCover(ctx, photo, box.x, box.y, box.w, box.h, 0.32);
  // glossy sheen
  const sheen = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.14)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();

  ctx.fillStyle = p.ink;
  ctx.textAlign = 'center';
  const lastLine = headline(ctx, era.headline, {
    x: POSTER_W / 2,
    y: box.y + box.h + 108,
    maxWidth: POSTER_W - M * 2 - 80,
    size: 80,
    lineHeight: 1.02,
    font: `italic 700 {size} ${SERIF}`,
  });

  ctx.fillStyle = p.accent;
  ctx.fillRect(POSTER_W / 2 - 46, lastLine + 36, 92, 2);

  ctx.fillStyle = p.muted;
  ctx.font = `400 28px ${SERIF}`;
  era.body.forEach((line, i) => {
    ctx.fillText(line, POSTER_W / 2, lastLine + 86 + i * 40);
  });

  // gold plaque
  const plaque = plaqueText(year, community);
  ctx.font = `600 24px ${MONO}`;
  const pw = trackedWidth(ctx, plaque, 4) + 60;
  const px = (POSTER_W - pw) / 2;
  const py = POSTER_H - M - 136;
  const gold = ctx.createLinearGradient(px, py, px, py + 60);
  gold.addColorStop(0, '#e3c766');
  gold.addColorStop(1, '#b8921f');
  ctx.fillStyle = gold;
  roundRect(ctx, px, py, pw, 60, 4);
  ctx.fill();
  ctx.fillStyle = '#2a2208';
  tracked(ctx, plaque, POSTER_W / 2, py + 38, 4, 'center');

  ctx.fillStyle = p.muted;
  ctx.font = `400 22px ${MONO}`;
  tracked(ctx, era.signoff, POSTER_W / 2, POSTER_H - M - 48, 4, 'center');
}

function billboard(ctx, { photo, era, year, community }) {
  const p = era.palette;
  const sky = ctx.createLinearGradient(0, 0, 0, POSTER_H);
  sky.addColorStop(0, '#8fc3de');
  sky.addColorStop(0.55, '#d8ecf4');
  sky.addColorStop(1, '#efe6d6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  // skyline
  ctx.fillStyle = 'rgba(31,70,92,0.3)';
  let x = -30;
  let seed = 7;
  while (x < POSTER_W + 60) {
    seed = (seed * 9301 + 49297) % 233280;
    const r = seed / 233280;
    const w = 110 + r * 150;
    const h = 150 + r * 430;
    ctx.fillRect(x, POSTER_H - 190 - h, w, h + 190);
    x += w + 5;
  }

  // ground
  ctx.fillStyle = '#cbbda2';
  ctx.fillRect(0, POSTER_H - 190, POSTER_W, 190);
  ctx.fillStyle = '#b9a98c';
  ctx.fillRect(0, POSTER_H - 190, POSTER_W, 8);

  // posts
  ctx.fillStyle = '#8d8171';
  ctx.fillRect(POSTER_W * 0.3, 980, 34, POSTER_H - 1130);
  ctx.fillRect(POSTER_W * 0.64, 980, 34, POSTER_H - 1130);

  // panel
  const panel = { x: 56, y: 150, w: POSTER_W - 112, h: 850 };
  ctx.save();
  shadow(ctx, 40, 22, 'rgba(20,40,55,0.35)');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(panel.x - 14, panel.y - 14, panel.w + 28, panel.h + 28);
  ctx.restore();
  clearShadow(ctx);

  ctx.fillStyle = p.ink;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

  // photo fills the left half, down to the footer strip
  const STRIP = 84;
  const photoW = panel.w * 0.56;
  const photoH = panel.h - STRIP;
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, photoW, photoH);
  ctx.clip();
  drawCover(ctx, photo, panel.x, panel.y, photoW, photoH, 0.26);
  const fade = ctx.createLinearGradient(panel.x + photoW - 150, 0, panel.x + photoW, 0);
  fade.addColorStop(0, 'rgba(18,48,63,0)');
  fade.addColorStop(1, 'rgba(18,48,63,0.95)');
  ctx.fillStyle = fade;
  ctx.fillRect(panel.x + photoW - 150, panel.y, 150, photoH);
  ctx.restore();

  // copy on the right
  const textX = panel.x + photoW + 40;
  ctx.textAlign = 'left';
  ctx.fillStyle = p.accent;
  ctx.font = `700 24px ${SANS}`;
  tracked(ctx, era.kicker, textX, panel.y + 120, 5);

  ctx.fillStyle = '#ffffff';
  headline(ctx, era.headline, {
    x: textX,
    y: panel.y + 230,
    maxWidth: panel.w - photoW - 80,
    size: 76,
    lineHeight: 1.08,
    font: `800 {size} ${SANS}`,
    align: 'left',
  });

  ctx.fillStyle = p.accent;
  ctx.fillRect(textX, panel.y + 400, 90, 6);

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = `400 25px ${SANS}`;
  ctx.textAlign = 'left';
  era.body.forEach((line, i) => {
    ctx.fillText(line, textX, panel.y + 460 + i * 36);
  });

  // footer strip: plaque on the left, the web address on the right
  const stripY = panel.y + panel.h - STRIP;
  ctx.fillStyle = p.accent;
  ctx.fillRect(panel.x, stripY, panel.w, STRIP);

  const plaque = plaqueText(year, community);
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 23px ${MONO}`;
  ctx.textAlign = 'left';
  tracked(ctx, plaque, panel.x + 32, stripY + STRIP / 2 + 8, 3);

  ctx.font = `700 28px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText(era.signoff, panel.x + panel.w - 32, stripY + STRIP / 2 + 9);
  ctx.textAlign = 'left';
}

function cover(ctx, { photo, era, year, community }) {
  const p = era.palette;
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  const photoH = POSTER_H - 190;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, POSTER_W, photoH);
  ctx.clip();
  drawCover(ctx, photo, 0, 0, POSTER_W, photoH, 0.26);
  const scrimTop = ctx.createLinearGradient(0, 0, 0, 420);
  scrimTop.addColorStop(0, 'rgba(10,18,26,0.55)');
  scrimTop.addColorStop(1, 'rgba(10,18,26,0)');
  ctx.fillStyle = scrimTop;
  ctx.fillRect(0, 0, POSTER_W, 420);
  const scrimBottom = ctx.createLinearGradient(0, photoH - 420, 0, photoH);
  scrimBottom.addColorStop(0, 'rgba(10,18,26,0)');
  scrimBottom.addColorStop(1, 'rgba(10,18,26,0.75)');
  ctx.fillStyle = scrimBottom;
  ctx.fillRect(0, photoH - 420, POSTER_W, 420);
  ctx.restore();

  // masthead
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  headline(ctx, era.headline.replace('\n', ' '), {
    x: POSTER_W / 2,
    y: 190,
    maxWidth: POSTER_W - 90,
    size: 132,
    lineHeight: 1,
    font: `700 {size} ${SERIF}`,
  });

  ctx.font = `600 22px ${MONO}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  tracked(ctx, `${era.kicker} · ${era.adYear}`, POSTER_W / 2, 238, 7, 'center');

  // cover lines
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  era.body.forEach((line, i) => {
    const y = photoH - 290 + i * 64;
    ctx.fillStyle = p.accent;
    ctx.fillRect(64, y - 22, 34, 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 34px ${SANS}`;
    ctx.fillText(line, 112, y);
  });

  // bottom bar
  ctx.fillStyle = p.ink;
  ctx.fillRect(0, photoH, POSTER_W, POSTER_H - photoH);

  const plaque = plaqueText(year, community);
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 26px ${MONO}`;
  ctx.textAlign = 'left';
  tracked(ctx, plaque, 64, photoH + 76, 4);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `400 22px ${MONO}`;
  tracked(ctx, era.signoff, 64, photoH + 122, 4);

  // barcode
  let bx = POSTER_W - 230;
  let bseed = 31;
  for (let i = 0; i < 34; i += 1) {
    bseed = (bseed * 1103515245 + 12345) % 2147483648;
    const w = 2 + ((bseed >> 7) % 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, photoH + 48, w, 74);
    bx += w + 3;
    if (bx > POSTER_W - 64) break;
  }
}

function post(ctx, { photo, era, year, community }) {
  const p = era.palette;
  ctx.fillStyle = '#ecebe8';
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  const card = { x: 60, y: 70, w: POSTER_W - 120, h: POSTER_H - 140 };
  const HEADER = 124;
  const FOOTER = 318;
  ctx.save();
  shadow(ctx, 50, 16, 'rgba(20,32,43,0.18)');
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, card.x, card.y, card.w, card.h, 34);
  ctx.fill();
  ctx.restore();
  clearShadow(ctx);

  // header row
  const avatar = { x: card.x + 34, y: card.y + 34, r: 34 };
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatar.x + avatar.r, avatar.y + avatar.r, avatar.r, 0, Math.PI * 2);
  ctx.clip();
  drawCover(ctx, photo, avatar.x, avatar.y, avatar.r * 2, avatar.r * 2, 0.18);
  ctx.restore();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatar.x + avatar.r, avatar.y + avatar.r, avatar.r + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = p.ink;
  ctx.font = `700 28px ${SANS}`;
  ctx.fillText(era.kicker, avatar.x + avatar.r * 2 + 24, avatar.y + 30);
  ctx.fillStyle = p.muted;
  ctx.font = `400 24px ${SANS}`;
  ctx.fillText((community || 'Dubai').trim(), avatar.x + avatar.r * 2 + 24, avatar.y + 62);

  ctx.fillStyle = p.muted;
  ctx.font = `700 30px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText('· · ·', card.x + card.w - 40, avatar.y + 44);
  ctx.textAlign = 'left';

  // photo: whatever height is left between header and footer, capped square
  const img = {
    x: card.x,
    y: card.y + HEADER,
    w: card.w,
    h: Math.min(card.w, card.h - HEADER - FOOTER),
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(img.x, img.y, img.w, img.h);
  ctx.clip();
  drawCover(ctx, photo, img.x, img.y, img.w, img.h, 0.28);
  ctx.restore();

  // action row
  const ay = img.y + img.h + 62;
  ctx.lineWidth = 3.4;
  ctx.lineJoin = 'round';
  ctx.save();
  ctx.translate(card.x + 44, ay - 8);
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.bezierCurveTo(-22, -12, -3, -26, 0, -12);
  ctx.bezierCurveTo(3, -26, 22, -12, 0, 10);
  ctx.fillStyle = p.accent;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = p.ink;
  ctx.beginPath();
  ctx.arc(card.x + 122, ay - 10, 17, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(card.x + 180, ay - 10);
  ctx.lineTo(card.x + 224, ay - 28);
  ctx.lineTo(card.x + 206, ay + 6);
  ctx.lineTo(card.x + 199, ay - 7);
  ctx.closePath();
  ctx.stroke();

  // likes - a stable number from the move-in year, so it never flickers
  const likes = 420 + ((Number(year) * 37) % 1480);
  ctx.fillStyle = p.ink;
  ctx.font = `700 26px ${SANS}`;
  ctx.fillText(`${likes.toLocaleString('en-GB')} likes`, card.x + 44, ay + 62);

  // caption
  const captionY = ay + 116;
  ctx.font = `700 28px ${SANS}`;
  const handleW = ctx.measureText(era.kicker).width;
  ctx.fillText(era.kicker, card.x + 44, captionY);
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(`  ${era.headline}`, card.x + 44 + handleW, captionY);
  ctx.fillStyle = '#3c6c92';
  ctx.fillText(era.signoff, card.x + 44, captionY + 42);

  // plaque pill
  const plaque = plaqueText(year, community);
  ctx.font = `600 23px ${MONO}`;
  const pw = trackedWidth(ctx, plaque, 3) + 52;
  const py = captionY + 74;
  ctx.fillStyle = '#14202b';
  roundRect(ctx, card.x + 44, py, pw, 54, 27);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  tracked(ctx, plaque, card.x + 70, py + 35, 3);
}

const TEMPLATES = { classified, brochure, billboard, cover, post };

/**
 * Render a finished poster.
 * @param {HTMLCanvasElement} canvas
 * @param {{photo: CanvasImageSource, era: object, year: number|string, community: string}} opts
 */
export function renderPoster(canvas, opts) {
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  ctx.textBaseline = 'alphabetic';
  const draw = TEMPLATES[opts.era.template] || cover;
  draw(ctx, opts);
  ctx.restore();
  return canvas;
}

export const templateNames = Object.keys(TEMPLATES);
