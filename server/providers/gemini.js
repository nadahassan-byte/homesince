/**
 * Google Gemini image generation / editing.
 *
 * Sends the selfie inline with the era prompt and pulls the first inline
 * image part back out of the response.
 */
export const id = 'gemini';

export function isConfigured(env) {
  return Boolean(env.GEMINI_API_KEY);
}

export async function generate({ imageBuffer, mimeType, prompt, env, signal }) {
  const model = env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType || 'image/png',
                data: imageBuffer.toString('base64'),
              },
            },
          ],
        },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    throw providerError('gemini', res.status, await safeText(res));
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const image = parts.find((p) => p.inline_data?.data || p.inlineData?.data);
  const data = image?.inline_data?.data || image?.inlineData?.data;
  const outMime =
    image?.inline_data?.mime_type || image?.inlineData?.mimeType || 'image/png';

  if (!data) throw providerError('gemini', res.status, 'no image in response');
  return { dataUrl: `data:${outMime};base64,${data}` };
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
