import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

/**
 * Drizzle database client.
 *
 * Connection target: Supabase Transaction Pooler (port 6543).
 *   - Required: `prepare: false` because pgbouncer in transaction mode
 *     does not support prepared statements.
 *   - Pool stays small (default 10 connections per Node process) since
 *     Supabase enforces global limits on the free tier.
 *
 * Auth context: this client connects with the database role embedded in
 * DATABASE_URL (typically the project owner). It bypasses RLS, so every
 * caller MUST have already gone through `requireAuth()` / `requireAdmin()`
 * helpers before issuing queries that touch user-scoped data. RLS still
 * applies to direct database connections from outside the app.
 *
 * Singleton across hot reloads in dev; Next.js wipes module state on
 * restart so we don't need globalThis caching for production.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set");
}

const client = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const db = drizzle({ client, schema });

export type DbClient = typeof db;
export { schema };
