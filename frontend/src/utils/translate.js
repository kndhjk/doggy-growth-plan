const TRANSLATE_API = '/api/ai/translate';
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function translateContent(text, targetLang) {
  if (!text || !text.trim()) return text || '-';
  const cacheKey = `${text.slice(0, 50)}__${targetLang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.text;
  try {
    const res = await fetch(TRANSLATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });
    const data = await res.json();
    const result = data.translated || text;
    cache.set(cacheKey, { text: result, ts: Date.now() });
    return result;
  } catch {
    return text;
  }
}