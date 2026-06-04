import { useEffect } from "react";
import { getFontGoogleUrl } from "@/lib/templateTypes";

interface FontLoaderProps {
  fontKey: string;
}

export function FontLoader({ fontKey }: FontLoaderProps) {
  useEffect(() => {
    const url = getFontGoogleUrl(fontKey);
    if (!url) return;
    const id = `gfont-${fontKey}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }, [fontKey]);

  return null;
}
