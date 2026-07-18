import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { resolve } from "path";
import { existsSync } from "fs";
import router from "./routes";
import sitemapRouter from "./routes/sitemapRoute";
import publicSeoRouter from "./routes/publicSeoRoute";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = new Set(
  [process.env.PUBLIC_ORIGIN, ...(process.env.ALLOWED_ORIGINS || "").split(",")]
    .filter(Boolean)
    .map((value) => new URL(value as string).origin),
);

app.use(helmet({
  crossOriginResourcePolicy: false,
  hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: false } : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "https://*.google-analytics.com"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
app.use((_req, res, next) => {
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()");
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) callback(null, true);
    else callback(new Error("Origin is not allowed"));
  },
}));
app.use(cookieParser());
app.use("/api/import/csv", express.json({ limit: "6mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(sitemapRouter);
app.use("/api", (_req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  next();
}, router);

// Serve compiled React frontend — Express 5 requires /{*splat} wildcard syntax
const _staticDir = process.env.STATIC_DIR || resolve(__dirname, "../../directory-master/dist/public");
if (existsSync(_staticDir)) {
  app.use(express.static(_staticDir, {
    index: false,
    setHeaders(res, filePath) {
      if (/\.[a-f0-9_-]{8,}\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));
  app.use(publicSeoRouter);
}

export default app;
