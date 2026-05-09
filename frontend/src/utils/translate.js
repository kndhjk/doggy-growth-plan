/**
 * Real-time content translation utility.
 * Calls the backend /api/ai/translate endpoint which uses Groq.
 * Results are cached in memory for 5 minutes to avoid redundant API calls.
 */

const TRANSLATE_API = '/api/ai/translate';

// In-memory translation cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Translate text to the target language via backend Groq endpoint.
 * Falls back to original text on failure.
 */
export async function translateContent(text, targetLang, sourceLang = 'auto') {
  if (!text || !text.trim()) return text;
  if (targetLang === sourceLang) return text;

  const cacheKey = `${text.slice(0, 50)}__${targetLang}__${sourceLang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.text;

  try {
    const res = await fetch(TRANSLATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });
    if (!res.ok) throw new Error('Translation API error');
    const data = await res.json();
    const result = data.translated || text;
    cache.set(cacheKey, { text: result, ts: Date.now() });
    return result;
  } catch {
    return text;
  }
}

/**
 * Translate multiple fields of an object.
 * Returns a new object with specified fields translated.
 */
export async function translateFields(obj, fields, targetLang, sourceLang = 'auto') {
  const result = { ...obj };
  await Promise.all(
    fields.map(async (field) => {
      if (obj[field]) {
        result[field] = await translateContent(obj[field], targetLang, sourceLang);
      }
    })
  );
  return result;
}

/**
 * Clear the translation cache (useful when lang changes significantly).
 */
export function clearTranslationCache() {
  cache.clear();
}
