/**
 * Era grading for the prototype path.
 *
 * When no AI provider is configured, this is what makes a 2024 phone selfie
 * read as a 1986 studio portrait: a base grade, bloom, tint, vignette, grain
 * and - for the newsprint ad - a halftone dot screen.
 */

/** Draw an image into a rect, cropped to cover, biased towards the face. */
export function drawCover(ctx, img, x, y, w, h, yBias = 0.38) {
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) * yBias;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const size = 180;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const data = ctx.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

/**
 * Turn a source image into a square, era-graded photo canvas.
 * @param {CanvasImageSource} img
 * @param {object} era entry from shared/eras.js
 * @param {number} size output edge in px
 */
export function gradePhoto(img, era, size = 1000) {
  const g = era.grade || {};
  const out = makeCanvas(size, size);
  const ctx = out.getContext('2d');

  ctx.fillStyle = '#d9d2c7';
  ctx.fillRect(0, 0, size, size);

  // 1. base grade
  ctx.save();
  if (g.filter) ctx.filter = g.filter;
  drawCover(ctx, img, 0, 0, size, size);
  ctx.restore();

  // 2. bloom - a blurred copy screened back over the top
  if (g.bloom) {
    const bloom = makeCanvas(size, size);
    const bctx = bloom.getContext('2d');
    bctx.filter = `${g.filter || ''} blur(${g.bloomBlur || 10}px)`.trim();
    drawCover(bctx, img, 0, 0, size, size);
    ctx.save();
    ctx.globalAlpha = g.bloom;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(bloom, 0, 0);
    ctx.restore();
  }

  // 3. colour cast
  if (g.tint && g.tint[3] > 0) {
    const [r, gr, b, a] = g.tint;
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(${r},${gr},${b},${a})`;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  // 4. vignette
  if (g.vignette) {
    const grad = ctx.createRadialGradient(
      size / 2, size * 0.45, size * 0.2,
      size / 2, size * 0.5, size * 0.78,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${g.vignette})`);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  // 5. grain
  if (g.grain) {
    const tile = getNoiseTile();
    ctx.save();
    ctx.globalAlpha = g.grain;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  // 6. newsprint dot screen
  if (g.halftone) {
    return halftone(out, g.halftone, era.palette);
  }
  return out;
}

/**
 * Dot-screen a canvas the way a 1980s newspaper press would: a 45-degree
 * grid of ink dots whose radius tracks how dark the photo is underneath.
 * `cellsAcross` is roughly how many dots fit along one edge.
 */
function halftone(source, cellsAcross, palette) {
  const size = source.width;
  const src = source.getContext('2d').getImageData(0, 0, size, size).data;

  const out = makeCanvas(size, size);
  const ctx = out.getContext('2d');
  ctx.fillStyle = palette?.paper || '#e9e2d2';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = palette?.ink || '#241f1a';

  const cell = Math.max(4, size / (cellsAcross || 110));
  const cos = Math.SQRT1_2;
  const sin = Math.SQRT1_2;
  const reach = size * 0.75;

  const lumAt = (x, y) => {
    const xi = Math.min(size - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(size - 1, Math.max(0, Math.round(y)));
    const i = (yi * size + xi) * 4;
    return (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) / 255;
  };

  const off = cell / 3;
  for (let v = -reach; v <= reach; v += cell) {
    for (let u = -reach; u <= reach; u += cell) {
      const x = size / 2 + u * cos - v * sin;
      const y = size / 2 + u * sin + v * cos;
      if (x < -cell || y < -cell || x > size + cell || y > size + cell) continue;

      const lum =
        (lumAt(x, y) +
          lumAt(x - off, y) +
          lumAt(x + off, y) +
          lumAt(x, y - off) +
          lumAt(x, y + off)) / 5;

      // stretch the midtones so the screen reads as ink, not grey mush
      const ink = Math.min(1, Math.max(0, (1 - lum - 0.04) / 0.82));
      const r = ink * cell * 0.72;
      if (r > 0.3) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  return out;
}

/** Load a File or data URL into an HTMLImageElement. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be opened.'));
    img.src = src;
  });
}

/** Shrink a selfie before it goes over the wire. */
export async function fileToDataUrl(file, maxEdge = 1024, quality = 0.9) {
  const raw = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(raw);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (Math.max(w, h) <= maxEdge) return { dataUrl: raw, image: img };

  const scale = maxEdge / Math.max(w, h);
  const c = makeCanvas(Math.round(w * scale), Math.round(h * scale));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', quality);
  return { dataUrl, image: await loadImage(dataUrl) };
}
