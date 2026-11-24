import * as openai from './openai.js';
import * as gemini from './gemini.js';

const REGISTRY = { openai, gemini };

/**
 * Pick the provider for this request.
 *
 * PORTRAIT_PROVIDER=none (or an unconfigured provider) means we never call
 * out at all: the browser keeps its locally filtered preview, which is the
 * prototype behaviour.
 */
export function resolveProvider(env) {
  const wanted = (env.PORTRAIT_PROVIDER || 'none').toLowerCase();
  if (wanted === 'none') return { id: 'none', provider: null, reason: 'disabled' };

  const provider = REGISTRY[wanted];
  if (!provider) {
    return { id: 'none', provider: null, reason: `unknown provider "${wanted}"` };
  }
  if (!provider.isConfigured(env)) {
    return { id: 'none', provider: null, reason: `${wanted} has no API key` };
  }
  return { id: provider.id, provider, reason: null };
}

export function providerStatus(env) {
  const { id, reason } = resolveProvider(env);
  return {
    provider: id,
    aiEnabled: id !== 'none',
    reason,
    available: Object.keys(REGISTRY),
  };
}
