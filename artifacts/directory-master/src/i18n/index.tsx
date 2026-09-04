import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, type Dict } from "./en";
import { es } from "./es";

// Lightweight EN/ES string layer. Language is a first-class shell control,
// persisted alongside the theme choice. Default follows the browser locale.

export type Lang = "en" | "es";
const STORAGE_KEY = "colrest.lang";
const DICTS: Record<Lang, Dict> = { en, es };

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch { /* SSR/private mode */ }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// Category names arrive from the DB in English; translate known ones for ES chrome.
const CATEGORY_ES: Record<string, string> = {
  "Colombian Restaurant": "Restaurante colombiano",
  "Bakery": "Panadería",
  "Coffee Shop": "Café",
  "Fast Food": "Comida rápida",
};

export function localizedCategory(name: string | null | undefined, lang: Lang): string {
  if (!name) return "";
  return lang === "es" ? (CATEGORY_ES[name] ?? name) : name;
}
