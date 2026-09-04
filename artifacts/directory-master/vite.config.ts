import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT || "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";
const theme = process.env.VITE_THEME;

const colrestBrandPlugin = {
  name: "colrest-brand-html",
  transformIndexHtml(html: string) {
    if (theme !== "colrest-fonda") return html;
    return html
      .replace("<title>Directory Master</title>", "<title>Colombian Restaurant Near Me</title>")
      .replace(
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
        [
          '<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png" />',
          '<link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />',
          '<link rel="manifest" href="/brand/site.webmanifest" />',
          '<meta name="theme-color" content="#B84A2E" />',
          '<meta property="og:site_name" content="Colombian Restaurant Near Me" />',
          '<meta property="og:image" content="https://colombianrestaurantnear.me/brand/social-avatar-1080.png" />',
          '<meta name="twitter:card" content="summary" />',
          '<meta name="twitter:image" content="https://colombianrestaurantnear.me/brand/social-avatar-1080.png" />',
        ].join("\n    "),
      );
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    colrestBrandPlugin,
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: process.env.BUILD_OUT_DIR || path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
