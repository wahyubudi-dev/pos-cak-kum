import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set");
}

const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  ssl: "require",
});

const globalForDb = globalThis as unknown as {
  _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function initDb() {
  return drizzle({ client, schema });
}

export const db = globalForDb._db ??= initDb();

export type DbClient = typeof db;
export { schema };
