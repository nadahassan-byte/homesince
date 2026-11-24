import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  eraById, eraForYear, skinToneById, presentationById, YEAR_MIN, YEAR_MAX,
} from '../shared/eras.js';
import { buildPrompt, creditLine } from './prompts.js';
import { resolveProvider, providerStatus } from './providers/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const env = process.env;
const PORT = Number(env.PORT) || 3000;
const MAX_UPLOAD_MB = Number(env.MAX_UPLOAD_MB) || 8;
const GENERATION_TIMEOUT_MS = Number(env.GENERATION_TIMEOUT_MS) || 90_000;

const app = express();
app.disable('x-powered-by');
// Selfies arrive as data URLs, so the JSON body carries the image.
app.use(express.json({ limit: `${MAX_UPLOAD_MB + 2}mb` }));

app.use(express.static(path.join(root, 'public'), { extensions: ['html'] }));
app.use('/shared', express.static(path.join(root, 'shared')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ...providerStatus(env) });
});

app.post('/api/portrait', async (req, res) => {
  const started = Date.now();
  const {
    imageDataUrl, community = '', year, eraId, consent, over18,
    toneId, presentationId,
  } = req.body || {};

  if (consent !== true) {
    return res.status(400).json({
      error: 'consent_required',
      message: 'We need the tick box before we can make a portrait from a photo.',
    });
  }

  if (over18 !== true) {
    return res.status(400).json({
      error: 'age_required',
      message: 'This is for entrants aged 18 and over.',
    });
  }

  const parsedYear = Number(year);
  if (!Number.isInteger(parsedYear) || parsedYear < YEAR_MIN || parsedYear > YEAR_MAX) {
    return res.status(400).json({
      error: 'bad_year',
      message: `Give a year between ${YEAR_MIN} and ${YEAR_MAX}.`,
    });
  }

  const era = (eraId && eraById(eraId)) || eraForYear(parsedYear);
  const image = parseDataUrl(imageDataUrl);
  if (!image) {
    return res.status(400).json({
      error: 'bad_image',
      message: 'Send a JPEG, PNG or WebP selfie as a data URL.',
    });
  }
  if (image.buffer.byteLength > MAX_UPLOAD_MB * 1024 * 1024) {
    return res.status(413).json({
      error: 'image_too_large',
      message: `That photo is over ${MAX_UPLOAD_MB}MB. Try a smaller one.`,
    });
  }

  const { id: providerId, provider, reason } = resolveProvider(env);
  const prompt = buildPrompt({
    era,
    community: String(community).slice(0, 80),
    year: parsedYear,
    tone: skinToneById(toneId),
    presentation: presentationById(presentationId),
  });

  // No provider configured: tell the browser to keep its filtered preview.
  if (!provider) {
    return res.json({
      mode: 'filter',
      provider: 'none',
      reason,
      eraId: era.id,
      credit: creditLine({ era, provider: 'none' }),
      prompt,
      ms: Date.now() - started,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);
  try {
    const { dataUrl } = await provider.generate({
      imageBuffer: image.buffer,
      mimeType: image.mimeType,
      prompt,
      env,
      signal: controller.signal,
    });
    res.json({
      mode: 'ai',
      provider: providerId,
      eraId: era.id,
      image: dataUrl,
      credit: creditLine({ era, provider: providerId }),
      ms: Date.now() - started,
    });
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    console.error('[portrait] generation failed:', err?.message || err);
    // The poster still works from the filtered preview, so this is a soft
    // failure: 200 with mode "filter" and a reason the UI can show.
    res.json({
      mode: 'filter',
      provider: 'none',
      eraId: era.id,
      credit: creditLine({ era, provider: 'none' }),
      reason: aborted
        ? 'the image model took too long'
        : 'the image model could not be reached',
      ms: Date.now() - started,
    });
  } finally {
    clearTimeout(timer);
  }
});

function parseDataUrl(value) {
  if (typeof value !== 'string') return null;
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value.trim());
  if (!match) return null;
  try {
    return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
  } catch {
    return null;
  }
}

app.listen(PORT, () => {
  const status = providerStatus(env);
  console.log(`Home since running on http://localhost:${PORT}`);
  console.log(
    status.aiEnabled
      ? `AI portraits on via ${status.provider}`
      : `AI portraits off (${status.reason}) - serving era filter previews`,
  );
});

export default app;
