import { useEffect } from "react";

/**
 * Converts a 6-digit hex color to the "H S% L%" string format
 * expected by the CSS custom properties in index.css.
 */
function hexToHsl(hex: string): string | null {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Returns "210 40% 98%" (near-white) for dark colors, "222.2 47.4% 11.2%" (near-black) for light colors. */
function foregroundForHsl(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return "210 40% 98%";
  const l = parseFloat(parts[2]);
  return l > 55 ? "222.2 47.4% 11.2%" : "210 40% 98%";
}

interface ThemeColorInjectorProps {
  themeColor?: string | null;
}

/**
 * Reads the admin-configured primary theme color and injects it as CSS custom
 * properties on <html>, overriding the defaults in index.css.
 *
 * This propagates to every Tailwind utility that uses --primary:
 *   bg-primary, text-primary, border-primary, ring-primary, hover:bg-primary/90 …
 *
 * Restored to defaults when the component unmounts.
 */
export function ThemeColorInjector({ themeColor }: ThemeColorInjectorProps) {
  useEffect(() => {
    if (!themeColor) return;

    const hsl = hexToHsl(themeColor);
    if (!hsl) return;

    const fg = foregroundForHsl(hsl);
    const root = document.documentElement;

    const prev = {
      primary: root.style.getPropertyValue("--primary"),
      primaryFg: root.style.getPropertyValue("--primary-foreground"),
      ring: root.style.getPropertyValue("--ring"),
    };

    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--primary-foreground", fg);
    root.style.setProperty("--ring", hsl);

    return () => {
      if (prev.primary) {
        root.style.setProperty("--primary", prev.primary);
      } else {
        root.style.removeProperty("--primary");
      }
      if (prev.primaryFg) {
        root.style.setProperty("--primary-foreground", prev.primaryFg);
      } else {
        root.style.removeProperty("--primary-foreground");
      }
      if (prev.ring) {
        root.style.setProperty("--ring", prev.ring);
      } else {
        root.style.removeProperty("--ring");
      }
    };
  }, [themeColor]);

  return null;
}
