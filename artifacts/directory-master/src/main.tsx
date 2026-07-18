import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Per-instance brand theme, selected at build time via VITE_THEME (see vite.config.ts /
// static-builds provisioning). Falls back to the neutral default in index.css if unset.
const theme = import.meta.env.VITE_THEME;
if (theme === "chn-flag-theme" || theme === "colombianhorsenetwork-tricolor") {
  await import("./themes/colombianhorsenetwork-tricolor.css");
} else if (theme === "chn-brand-book") {
  await import("./themes/chn-brand-book.css");
} else if (theme === "colrest-fonda") {
  await import("./themes/colrest-fonda.css");
}

createRoot(document.getElementById("root")!).render(<App />);
