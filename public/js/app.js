import {
  ERAS, SKIN_TONES, PRESENTATIONS, eraForYear, eraById,
  YEAR_MIN, YEAR_MAX, BRAND,
} from '/shared/eras.js';
import { gradePhoto, loadImage, fileToDataUrl } from './filters.js';
import { renderPoster, POSTER_W, POSTER_H } from './templates.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/* ----------------------------------------------------------------- state */

const STEPS = ['start', 'age', 'poster', 'look', 'selfie', 'developing', 'result'];

const state = {
  step: 'start',
  over18: false,
  era: null,
  year: '',
  tone: null,
  presentation: null,
  community: '',
  sourceImage: null,
  sourceDataUrl: null,
  consent: false,
  busy: false,
  credit: '',
  hasResult: false,
};

const els = {
  progress: $('#progress'),
  progressBar: $('#progress-bar'),
  restart: $('#restart'),
  year: $('#year'),
  posterGrid: $('#poster-grid'),
  posterNext: $('#poster-next'),
  toneRow: $('#tone-row'),
  presentationRow: $('#presentation-row'),
  community: $('#community'),
  lookNext: $('#look-next'),
  file: $('#file'),
  camera: $('#camera'),
  drop: $('#drop'),
  thumb: $('#thumb'),
  dropCopy: $('#drop-copy'),
  takePhoto: $('#take-photo'),
  consent: $('#consent'),
  create: $('#create'),
  formError: $('#form-error'),
  devYear: $('#dev-year'),
  devStatus: $('#dev-status'),
  devBar: $('#dev-bar'),
  devQueue: $('#dev-queue'),
  canvas: $('#poster'),
  resultTitle: $('#result-title'),
  resultCaption: $('#result-caption'),
  notice: $('#notice'),
  share: $('#share'),
  download: $('#download'),
  another: $('#another'),
  fineprint: $('#result-fineprint'),
  ageNoMsg: $('#age-no-msg'),
};

/* ------------------------------------------------------------ navigation */

function go(step) {
  state.step = step;
  $$('.screen').forEach((s) => s.classList.toggle('is-active', s.dataset.step === step));

  const i = STEPS.indexOf(step);
  const showProgress = i > 0 && step !== 'result';
  els.progress.hidden = !showProgress;
  els.progressBar.style.width = `${(i / (STEPS.length - 2)) * 100}%`;
  els.restart.hidden = i < 2;

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* --------------------------------------------------------- poster chooser */

/** A stand-in portrait so each ad can be previewed before any selfie exists. */
function placeholderPortrait(era) {
  const size = 760;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#cdbfa9');
  g.addColorStop(1, '#8d7f6d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(32,28,24,0.42)';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.4, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 1.02, size * 0.32, size * 0.42, 0, Math.PI, 0);
  ctx.fill();
  return gradePhoto(c, era, size);
}

function buildPosterGrid() {
  els.posterGrid.innerHTML = '';
  const full = document.createElement('canvas');

  ERAS.forEach((era, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'poster-card';
    card.dataset.eraId = era.id;
    card.innerHTML = `
      <canvas width="300" height="375"></canvas>
      <span class="poster-card__meta">
        <span class="poster-card__year">${era.label}</span>
        <span class="poster-card__name">${era.adName}</span>
      </span>
    `;
    card.addEventListener('click', () => selectEra(era.id, { fromClick: true }));
    els.posterGrid.appendChild(card);

    // draw the thumbnail one frame at a time so the grid paints immediately
    setTimeout(() => {
      try {
        renderPoster(full, {
          photo: placeholderPortrait(era),
          era,
          year: era.adYear,
          community: '',
        });
        const thumb = card.querySelector('canvas');
        const tctx = thumb.getContext('2d');
        tctx.drawImage(full, 0, 0, POSTER_W, POSTER_H, 0, 0, thumb.width, thumb.height);
      } catch (err) {
        console.error('thumbnail failed for', era.id, err);
      }
    }, 40 * index);
  });
}

function selectEra(id, { fromClick = false } = {}) {
  state.era = eraById(id);
  $$('.poster-card').forEach((c) => c.classList.toggle('is-selected', c.dataset.eraId === id));
  els.posterNext.disabled = !state.era;
  if (fromClick && !state.year) state.year = String(state.era.adYear);
}

function markYourEra(era) {
  $$('.poster-card__badge').forEach((b) => b.remove());
  if (!era) return;
  const card = els.posterGrid.querySelector(`[data-era-id="${era.id}"]`);
  if (!card) return;
  const badge = document.createElement('span');
  badge.className = 'poster-card__badge';
  badge.textContent = 'YOUR ERA';
  card.appendChild(badge);
}

/* --------------------------------------------------------- look chooser */

function buildLookPickers() {
  els.toneRow.innerHTML = '';
  SKIN_TONES.forEach((tone) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tone';
    b.style.background = tone.swatch;
    b.title = tone.label;
    b.setAttribute('aria-label', tone.label);
    b.addEventListener('click', () => {
      state.tone = tone.id;
      $$('.tone').forEach((t) => t.classList.remove('is-selected'));
      b.classList.add('is-selected');
      validateLook();
    });
    els.toneRow.appendChild(b);
  });

  els.presentationRow.innerHTML = '';
  PRESENTATIONS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pill';
    b.textContent = p.label;
    b.addEventListener('click', () => {
      state.presentation = p.id;
      $$('.pill').forEach((x) => x.classList.remove('is-selected'));
      b.classList.add('is-selected');
      validateLook();
    });
    els.presentationRow.appendChild(b);
  });
}

function validateLook() {
  els.lookNext.disabled = !(state.tone && state.presentation);
}

/* ---------------------------------------------------------------- selfie */

async function handleFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    return showError('That needs to be a JPEG, PNG or WebP photo.');
  }
  if (file.size > 12 * 1024 * 1024) {
    return showError('That photo is over 12MB. Try a smaller one.');
  }
  showError('');
  try {
    const { dataUrl, image } = await fileToDataUrl(file, 1024, 0.9);
    state.sourceDataUrl = dataUrl;
    state.sourceImage = image;
    els.thumb.src = dataUrl;
    els.thumb.hidden = false;
    els.dropCopy.textContent = 'Use a different photo';
    validateSelfie();
  } catch (err) {
    showError(err.message || 'That photo could not be opened.');
  }
}

function showError(message) {
  els.formError.textContent = message || '';
  els.formError.hidden = !message;
}

function validateSelfie() {
  els.create.disabled = !(state.sourceDataUrl && state.consent) || state.busy;
}

/* ------------------------------------------------------------- generate */

const DEV_STEPS = [
  'Opening the archive',
  'Finding the ad',
  'Restyling your photo',
  'Setting the type',
  'Printing',
];

function runDevelopingAnimation(era) {
  els.devYear.textContent = state.year || era.adYear;
  els.devQueue.textContent = `${era.adName} · ${era.adYear}`;
  let progress = 0;
  let step = 0;
  els.devStatus.textContent = DEV_STEPS[0];
  els.devBar.style.width = '0%';

  const timer = setInterval(() => {
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
      year: Number(state.year) || era.adYear,
      eraId: era.id,
      toneId: state.tone,
      presentationId: state.presentation,
      consent: state.consent,
      over18: state.over18,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'The portrait service turned that down.');
  }
  return res.json();
}

async function create() {
  if (!state.sourceDataUrl) return showError('Add a selfie first.');
  if (!state.consent) return showError('Tick the box so we can use your photo.');

  const era = state.era || eraForYear(state.year);
  state.busy = true;
  state.hasResult = false;
  els.create.disabled = true;
  showError('');
  els.notice.hidden = true;
  go('developing');

  const anim = runDevelopingAnimation(era);
  const minimumWait = new Promise((r) => setTimeout(r, 1600));

  let photo = null;
  let credit = `${era.lookShort} · era filter preview`;
  let notice = '';
  let mode = 'filter';

  try {
    const result = await requestPortrait(era);
    if (result.mode === 'ai' && result.image) {
      photo = await loadImage(result.image);
      credit = result.credit;
      mode = 'ai';
    } else {
      credit = result.credit || credit;
      if (result.reason && result.reason !== 'disabled') {
        notice = `Showing the era filter: ${result.reason}.`;
      }
    }
  } catch (err) {
    notice = 'Showing the era filter: the portrait service is not reachable.';
  }

  if (!photo) photo = gradePhoto(state.sourceImage, era, 1000);

  await minimumWait;
  anim.finish();

  state.credit = credit;
  renderPoster(els.canvas, {
    photo,
    era,
    year: state.year || era.adYear,
    community: state.community,
  });
  els.resultTitle.textContent = `Home since ${state.year || era.adYear}.`;
  els.resultCaption.textContent = credit;
  els.fineprint.textContent =
    mode === 'ai'
      ? 'The photograph is AI generated. The ad layout, logo and plaque are a fixed betterhomes design.'
      : `Your photo was restyled with the ${era.label} era filter, not an AI model. `
        + 'The ad layout, logo and plaque are a fixed betterhomes design.';
  if (notice) {
    els.notice.textContent = notice;
    els.notice.hidden = false;
  }

  state.busy = false;
  state.hasResult = true;
  go('result');
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
  if (!state.hasResult) return;
  const blob = await canvasToBlob(els.canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = posterFilename();
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function share() {
  if (!state.hasResult) return;
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

function restart({ keepPhoto = false } = {}) {
  state.era = null;
  state.hasResult = false;
  state.credit = '';
  els.notice.hidden = true;
  $$('.poster-card').forEach((c) => c.classList.remove('is-selected'));
  els.posterNext.disabled = true;

  if (!keepPhoto) {
    state.sourceImage = null;
    state.sourceDataUrl = null;
    state.consent = false;
    state.year = '';
    state.community = '';
    state.tone = null;
    state.presentation = null;
    els.consent.checked = false;
    els.thumb.hidden = true;
    els.thumb.removeAttribute('src');
    els.dropCopy.textContent = 'Upload a photo';
    els.file.value = '';
    els.camera.value = '';
    els.year.value = '';
    els.community.value = '';
    $$('.tone, .pill').forEach((b) => b.classList.remove('is-selected'));
    validateLook();
    validateSelfie();
    markYourEra(null);
    go('start');
    return;
  }

  // Keeping the photo: Create was disabled while the last ad generated, so
  // re-derive both gates from the state we are holding on to.
  validateLook();
  validateSelfie();
  go('poster');
}

/* ----------------------------------------------------------------- wire */

$$('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));

$('#age-yes').addEventListener('click', () => {
  state.over18 = true;
  els.ageNoMsg.hidden = true;
  go('poster');
});
$('#age-no').addEventListener('click', () => {
  state.over18 = false;
  els.ageNoMsg.hidden = false;
});

els.year.addEventListener('input', (e) => {
  state.year = e.target.value.trim();
  const y = Number(state.year);
  if (Number.isInteger(y) && y >= YEAR_MIN && y <= YEAR_MAX) {
    const era = eraForYear(y);
    markYourEra(era);
    selectEra(era.id);
  } else {
    markYourEra(null);
  }
});

els.posterNext.addEventListener('click', () => go('look'));
els.lookNext.addEventListener('click', () => go('selfie'));

els.community.addEventListener('input', (e) => {
  state.community = e.target.value.slice(0, 60);
});

els.drop.addEventListener('click', () => els.file.click());
els.drop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    els.file.click();
  }
});
els.takePhoto.addEventListener('click', () => els.camera.click());
els.file.addEventListener('change', (e) => handleFile(e.target.files?.[0]));
els.camera.addEventListener('change', (e) => handleFile(e.target.files?.[0]));

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

els.consent.addEventListener('change', (e) => {
  state.consent = e.target.checked;
  validateSelfie();
});

els.create.addEventListener('click', create);
els.share.addEventListener('click', share);
els.download.addEventListener('click', download);
els.another.addEventListener('click', () => restart({ keepPhoto: true }));
els.restart.addEventListener('click', () => restart());

async function boot() {
  buildLookPickers();
  try {
    await document.fonts.ready;
  } catch {
    /* fonts are a nicety, carry on */
  }
  buildPosterGrid();
  go('start');
}

boot();
