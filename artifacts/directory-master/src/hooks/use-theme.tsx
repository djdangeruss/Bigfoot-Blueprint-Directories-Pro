import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Light/dark control for the colrest shell. "system" follows prefers-color-scheme.
// Applies BOTH data-theme (drives the fonda token overrides) and the .dark class
// (drives existing `dark:` utility styles) so the two systems never disagree.

export type ThemePref = "light" | "dark" | "system";
const STORAGE_KEY = "colrest.theme";

function initialPref(): ThemePref {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch { /* ignore */ }
  return "system";
}

function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const ThemeContext = createContext<{ pref: ThemePref; isDark: boolean; setPref: (p: ThemePref) => void; toggle: () => void }>({
  pref: "system", isDark: false, setPref: () => {}, toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(initialPref);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSysDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isDark = pref === "dark" || (pref === "system" && sysDark);

  useEffect(() => {
    const root = document.documentElement;
    if (pref === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", pref);
    root.classList.toggle("dark", isDark);
  }, [pref, isDark]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    try { localStorage.setItem(STORAGE_KEY, p); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    setPref(isDark ? "light" : "dark");
  }, [isDark, setPref]);

  const value = useMemo(() => ({ pref, isDark, setPref, toggle }), [pref, isDark, setPref, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
