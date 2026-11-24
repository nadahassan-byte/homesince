/**
 * OpenAI image edits (gpt-image-1).
 *
 * Takes the uploaded selfie plus the era prompt and returns a restyled PNG
 * as a base64 data URL.
 */
export const id = 'openai';

export function isConfigured(env) {
  return Boolean(env.OPENAI_API_KEY);
}

export async function generate({ imageBuffer, mimeType, prompt, env, signal }) {
  const model = env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('size', '1024x1024');
  form.append('n', '1');
  form.append(
    'image',
    new Blob([imageBuffer], { type: mimeType || 'image/png' }),
    'selfie.png',
  );

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
    signal,
  });

  if (!res.ok) {
    throw providerError('openai', res.status, await safeText(res));
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw providerError('openai', res.status, 'no image in response');
  return { dataUrl: `data:image/png;base64,${b64}` };
}

function providerError(provider, status, detail) {
  const err = new Error(`${provider} image request failed (${status}): ${detail}`);
  err.provider = provider;
  err.status = status;
  return err;
}

async function safeText(res) {
  try {
    return (await res.text()).slice(0, 400);
  } catch {
    return 'unreadable error body';
  }
}
