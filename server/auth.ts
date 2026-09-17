/**
 * ⚠️  PLACEHOLDER AUTH — replace this before real users touch the app.
 *
 * Every /api/me route acts on behalf of whoever `currentUserId` returns.
 * Here that's one hard-coded demo user. In your app, read it from your
 * session or verified JWT.
 *
 * Never take the user id from the request body, query, or URL: anyone
 * could put someone else's id there and see (or spend) their money.
 */
import type { Request } from "express";

export const DEMO_USER_ID = "demo-user-1";

export function currentUserId(_req: Request): string {
  return DEMO_USER_ID;
}
