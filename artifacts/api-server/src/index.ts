import app from "./app";
import { logger } from "./lib/logger";
import { getSetupToken } from "./lib/setupToken.js";

const rawPort = process.env.PORT;
if (!rawPort) throw new Error("PORT environment variable is required");

const port = Number(rawPort);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  if (getSetupToken()) {
    logger.warn("First-run setup is available; retrieve the bootstrap token from the approved runtime secret channel");
  }
});
