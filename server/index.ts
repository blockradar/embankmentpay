/**
 * The API server. It exists for one reason: the Blockradar API key must
 * never reach the browser. The React app calls /api/* here, and only this
 * process talks to Blockradar.
 *
 * Run it with `npm run dev` (together with the web app) or `npm run dev:api`.
 */
import express from "express";
import { config } from "./config";
import { errorHandler } from "./errors";
import { accountRouter } from "./routes/account";
import { depositRouter } from "./routes/deposit";
import { webhooksRouter } from "./routes/webhooks";
import { loadWallets } from "./wallets";

const app = express();

// Webhooks first: they need the raw request body to verify the signature,
// and express.json() below would consume it.
app.use(webhooksRouter);

app.use(express.json());
app.use("/api", accountRouter);
app.use("/api", depositRouter);

// Must be registered after the routes it handles errors for.
app.use(errorHandler);

try {
  // Verify the key and every wallet BEFORE accepting traffic.
  await loadWallets();
} catch (err) {
  console.error(`✗ Startup check failed: ${(err as Error).message}`);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
