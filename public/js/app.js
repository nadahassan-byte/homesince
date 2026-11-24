import { ERAS, eraForYear, YEAR_MIN, YEAR_MAX, BRAND } from '/shared/eras.js';
import { gradePhoto, loadImage, fileToDataUrl } from './filters.js';
import { renderPoster } from './templates.js';

const $ = (sel) => document.querySelector(sel);

const state = {
  file: null,
  sourceImage: null,
  sourceDataUrl: null,
  community: '',
  year: '',
  eraOverride: null,
  consent: false,
  busy: false,
  poster: null,
  credit: '',
};

const els = {
  drop: $('#drop'),
  fileInput: $('#file'),
  thumb: $('#thumb'),
  dropCopy: $('#drop-copy'),
  community: $('#community'),
  year: $('#year'),
  consent: $('#consent'),
  create: $('#create'),
  formError: $('#form-error'),
  adName: $('#ad-name'),

  stage2: $('#stage2'),
  devYear: $('#dev-year'),
  devStatus: $('#dev-status'),
  devBar: $('#dev-bar'),

  canvas: $('#poster'),
  resultCaption: $('#result-caption'),
  resultTitle: $('#result-title'),
  resultActions: $('#result-actions'),
  share: $('#share'),
  download: $('#download'),
  again: $('#again'),
  cards: $('#era-cards'),
  notice: $('#notice'),
};

/* ----------------------------------------------------------- era picker */

function activeEra() {
  if (state.eraOverride) return state.eraOverride;
  if (state.year) return eraForYear(state.year);
  return null;
}

function renderCards() {
  const current = activeEra();
  els.cards.innerHTML = '';
  for (const era of ERAS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'era-card' + (current && current.id === era.id ? ' is-active' : '');
    card.innerHTML = `
      <span class="era-card__ad">${era.adName}</span>
      <span class="era-card__label">${era.label}</span>
      <span class="era-card__blurb">${era.blurb}</span>
    `;
    card.addEventListener('click', () => {
      state.eraOverride = era;
      renderCards();
      updateAdName();
      previewEra(era);
    });
    els.cards.appendChild(card);
  }
}

function updateAdName() {
  const era = activeEra();
  els.adName.textContent = era
    ? `${era.adName} · ${era.label}`
    : 'Add a year and we will pick the ad';
}

/* --------------------------------------------------------- placeholder */

/** A stand-in portrait so an ad design can be previewed without a selfie. */
function placeholderPortrait(era) {
  const size = 900;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#c9bba6');
  g.addColorStop(1, '#8c7e6c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(32,28,24,0.4)';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.4, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 1.02, size * 0.32, size * 0.42, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '600 26px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR PHOTO HERE', size / 2, size * 0.88);
  return gradePhoto(c, era, 900);
}

function previewEra(era) {
  if (state.busy) return;
  const photo = state.sourceImage
    ? gradePhoto(state.sourceImage, era, 1000)
    : placeholderPortrait(era);
  drawPoster(photo, era, { preview: !state.sourceImage });
}

/* -------------------------------------------------------------- posters */

function drawPoster(photo, era, { preview = false } = {}) {
  renderPoster(els.canvas, {
    photo,
    era,
    year: state.year || era.adYear,
    community: state.community,
  });
  els.canvas.classList.add('is-ready');
  els.resultTitle.textContent = preview
    ? `${era.adName} · preview`
    : `Home since ${state.year}.`;
  els.resultCaption.textContent = preview
    ? `${era.blurb} Add your selfie to star in it.`
    : state.credit;
  els.resultActions.hidden = preview;
  state.poster = preview ? null : els.canvas;
}

/* ---------------------------------------------------------------- input */

async function handleFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    showError('That needs to be a JPEG, PNG or WebP photo.');
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    showError('That photo is over 12MB. Try a smaller one.');
    return;
  }
  showError('');
  try {
    const { dataUrl, image } = await fileToDataUrl(file, 1024, 0.9);
    state.file = file;
    state.sourceDataUrl = dataUrl;
    state.sourceImage = image;
    els.thumb.src = dataUrl;
    els.thumb.hidden = false;
    els.dropCopy.textContent = 'Change the selfie';
    els.drop.classList.add('has-photo');
    validate();
    const era = activeEra();
    if (era) previewEra(era);
  } catch (err) {
    showError(err.message || 'That photo could not be opened.');
  }
}

function showError(message) {
  els.formError.textContent = message || '';
  els.formError.hidden = !message;
}

function validate() {
  const yearNum = Number(state.year);
  const yearOk =
    Number.isInteger(yearNum) && yearNum >= YEAR_MIN && yearNum <= YEAR_MAX;
  const ready = Boolean(state.sourceDataUrl) && yearOk && state.consent;
  els.create.disabled = !ready || state.busy;
  return { ready, yearOk };
}

/* ------------------------------------------------------------ generate */

const DEV_STEPS = [
  'Opening the archive',
  'Finding the ad from that year',
  'Restyling your photo',
  'Setting the type',
  'Printing',
];

function runDevelopingAnimation(era) {
  els.stage2.classList.add('is-running');
  els.devYear.textContent = state.year;
  let progress = 0;
  let step = 0;
  els.devStatus.textContent = DEV_STEPS[0];
  const timer = setInterval(() => {
    // creeps towards 90% and waits there for the real response
    progress = Math.min(90, progress + 2 + Math.random() * 4);
    els.devBar.style.width = `${progress}%`;
    const next = Math.min(DEV_STEPS.length - 1, Math.floor(progress / 20));
    if (next !== step) {
      step = next;
      els.devStatus.textContent = DEV_STEPS[step];
    }
  }, 220);

  return {
    finish() {
      clearInterval(timer);
      els.devBar.style.width = '100%';
      els.devStatus.textContent = `${era.adName} · ${era.adYear}`;
      setTimeout(() => {
        els.stage2.classList.remove('is-running');
        els.devBar.style.width = '0%';
      }, 500);
    },
  };
}

async function requestPortrait(era) {
  const res = await fetch('/api/portrait', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageDataUrl: state.sourceDataUrl,
      community: state.community,
      year: Number(state.year),
      eraId: era.id,
      consent: state.consent,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'The portrait service turned that down.');
  }
  return res.json();
}

async function create() {
  const { ready, yearOk } = validate();
  if (!ready) {
    if (!state.sourceDataUrl) showError('Add a selfie first.');
    else if (!yearOk) showError(`Give a year between ${YEAR_MIN} and ${YEAR_MAX}.`);
    else showError('Tick the box so we can use your photo.');
    return;
  }

  const era = activeEra() || eraForYear(state.year);
  state.busy = true;
  state.poster = null;
  els.create.disabled = true;
  els.resultActions.hidden = true;
  els.canvas.classList.remove('is-ready');
  showError('');
  els.notice.hidden = true;
  const anim = runDevelopingAnimation(era);
  const minimumWait = new Promise((r) => setTimeout(r, 1400));

  let photo = null;
  let credit = `${era.lookShort} · era filter preview`;
  let notice = '';

  try {
    const result = await requestPortrait(era);
    if (result.mode === 'ai' && result.image) {
      photo = await loadImage(result.image);
      credit = result.credit;
    } else {
      credit = result.credit || credit;
      if (result.reason && result.reason !== 'disabled') {
        notice = `Showing the era filter: ${result.reason}.`;
      }
    }
  } catch (err) {
    // Offline, or served as a static page with no API behind it.
    notice = 'Showing the era filter: the portrait service is not reachable.';
  }

  if (!photo) photo = gradePhoto(state.sourceImage, era, 1000);

  await minimumWait;
  state.credit = credit;
  drawPoster(photo, era, { preview: false });
  anim.finish();

  if (notice) {
    els.notice.textContent = notice;
    els.notice.hidden = false;
  }

  state.busy = false;
  validate();
  els.canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* --------------------------------------------------------------- output */

function posterFilename() {
  const place = (state.community || 'dubai').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `home-since-${state.year || 'dubai'}-${place}.png`.replace(/-+/g, '-');
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function download() {
  if (!state.poster) return;
  const blob = await canvasToBlob(els.canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = posterFilename();
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function share() {
  if (!state.poster) return;
  const blob = await canvasToBlob(els.canvas);
  const file = new File([blob], posterFilename(), { type: 'image/png' });
  const text = `Home since ${state.year}${state.community ? ` · ${state.community}` : ''} ${BRAND.hashtag}`;

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: 'Home since' });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
  }
  await download();
  els.notice.textContent = 'Saved the image - share it from your photos.';
  els.notice.hidden = false;
}

function reset() {
  state.file = null;
  state.sourceImage = null;
  state.sourceDataUrl = null;
  state.poster = null;
  state.consent = false;
  els.consent.checked = false;
  els.thumb.hidden = true;
  els.thumb.removeAttribute('src');
  els.drop.classList.remove('has-photo');
  els.dropCopy.textContent = 'Add a selfie';
  els.fileInput.value = '';
  els.canvas.classList.remove('is-ready');
  els.resultActions.hidden = true;
  els.notice.hidden = true;
  els.resultTitle.textContent = 'Your ad, when it is ready.';
  els.resultCaption.textContent = 'Press Create on the first screen.';
  const era = activeEra();
  if (era) previewEra(era);
  validate();
}

/* ----------------------------------------------------------------- wire */

els.fileInput.addEventListener('change', (e) => handleFile(e.target.files?.[0]));
els.drop.addEventListener('click', () => els.fileInput.click());
els.drop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    els.fileInput.click();
  }
});
['dragenter', 'dragover'].forEach((type) =>
  els.drop.addEventListener(type, (e) => {
    e.preventDefault();
    els.drop.classList.add('is-over');
  }),
);
['dragleave', 'drop'].forEach((type) =>
  els.drop.addEventListener(type, (e) => {
    e.preventDefault();
    els.drop.classList.remove('is-over');
  }),
);
els.drop.addEventListener('drop', (e) => handleFile(e.dataTransfer?.files?.[0]));

els.community.addEventListener('input', (e) => {
  state.community = e.target.value.slice(0, 60);
  validate();
});
els.year.addEventListener('input', (e) => {
  state.year = e.target.value.trim();
  state.eraOverride = null;
  renderCards();
  updateAdName();
  validate();
  const era = activeEra();
  if (era && !state.poster) previewEra(era);
});
els.consent.addEventListener('change', (e) => {
  state.consent = e.target.checked;
  validate();
});
els.create.addEventListener('click', create);
els.share.addEventListener('click', share);
els.download.addEventListener('click', download);
els.again.addEventListener('click', reset);

async function boot() {
  renderCards();
  updateAdName();
  validate();
  try {
    await document.fonts.ready;
  } catch {
    /* fonts are a nicety, carry on */
  }
  previewEra(ERAS[2]);
}

boot();
