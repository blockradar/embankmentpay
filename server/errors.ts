import type { ErrorRequestHandler } from "express";
import { BlockradarError } from "./blockradar";

/** An error whose message is safe to show the user, with the HTTP status to send. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Last stop for every error thrown in a route. The rule: log everything
 * on the server, send the browser only what's safe and useful.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof BlockradarError) {
    console.error(`[blockradar] ${err.status} ${err.message}`);
    if (err.status === 401) {
      console.error("[blockradar] hint: is this machine's current IP on the API key's allowlist?");
    }
    // A 4xx from Blockradar is usually about the request ("Insufficient
    // balance") — its message helps the user. A 401/403 or 5xx means OUR
    // setup is broken; the user can't fix that, so don't leak the details.
    const isUserFixable = err.status >= 400 && err.status < 500 && err.status !== 401 && err.status !== 403;
    res
      .status(isUserFixable ? 400 : 502)
      .json({ error: isUserFixable ? err.message : "Payments are temporarily unavailable." });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
};
