import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import zh from './locales/zh';
import en from './locales/en';
import ja from './locales/ja';
import mi from './locales/mi';

const LOCALES = { zh, en, ja, mi };
const STORAGE_KEY = 'gg_lang';

function detectInitialLang() {
  const saved = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
  if (saved && LOCALES[saved]) return saved;
  if (typeof navigator !== 'undefined') {
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('mi')) return 'mi';
    if (nav.startsWith('en')) return 'en';
  }
  return 'zh';
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

const I18nContext = createContext({
  lang: 'zh',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!LOCALES[next]) return;
    setLangState(next);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict  = LOCALES[lang]  || LOCALES.zh;
      const fall  = LOCALES.zh;
      const value = dict[key] ?? fall[key] ?? key;
      return interpolate(value, vars);
    },
    [lang]
  );

  const ctx = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// Display order in language picker. English first (default for international
// app), Māori second (NZ official indigenous), Chinese third (team origin),
// Japanese fourth.
export const SUPPORTED_LANGS = ['en', 'mi', 'zh', 'ja'];

export const LANG_FLAGS = {
  en: '🇬🇧',
  mi: '🇳🇿',
  zh: '🇨🇳',
  ja: '🇯🇵',
};
