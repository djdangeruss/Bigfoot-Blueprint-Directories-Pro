import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { resolve } from "path";
import { existsSync } from "fs";
import router from "./routes";
import sitemapRouter from "./routes/sitemapRoute";
import { logger } from "./lib/logger";

const app: Express = express();

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
app.use(cors());
app.use("/api/import/csv", express.json({ limit: "6mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(sitemapRouter);
app.use("/api", router);

// Serve compiled React frontend — Express 5 requires /{*splat} wildcard syntax
const _staticDir = process.env.STATIC_DIR || resolve(__dirname, "../../directory-master/dist/public");
if (existsSync(_staticDir)) {
  app.use(express.static(_staticDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(resolve(_staticDir, "index.html"));
  });
}

export default app;
