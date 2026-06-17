import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

/**
 * Custom migrator for Kedai Cak Kum.
 *
 * Why not drizzle-kit migrate?
 *   - drizzle-kit only knows about migrations it generated. Our migration
 *     folder also contains hand-written SQL for things Drizzle Kit doesn't
 *     model (RLS policies, triggers, storage buckets, realtime publication).
 *   - We want one command that applies BOTH styles in chronological order.
 *
 * How it works:
 *   1. Connect to DATABASE_URL.
 *   2. Ensure a `_migrations` tracking table exists.
 *   3. List every `*.sql` file under drizzle/migrations/ (excluding meta/).
 *   4. Sort by filename — our naming convention is YYYYMMDDHHMMSS_*.sql so
 *      lexical order = chronological order.
 *   5. For each pending file (not yet recorded in _migrations), wrap the
 *      file in BEGIN/COMMIT and execute it. Failure rolls back atomically.
 *   6. Record success in _migrations.
 *
 * Idempotent: re-running this script after a successful migration does
 * nothing.
 */

config({ path: ".env" });
config({ path: ".env.local", override: true });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[migrate] DATABASE_URL must be set");
  process.exit(1);
}

const MIGRATIONS_DIR = resolve(process.cwd(), "drizzle/migrations");
const TRACKING_TABLE = "_migrations";

async function main() {
  const sql = postgres(DATABASE_URL!, {
    prepare: false,
    max: 1,
    ssl: "require",
    onnotice: () => {},
  });

  try {
    await ensureTrackingTable(sql);

    const files = await listMigrationFiles();
    if (files.length === 0) {
      console.log("[migrate] no migration files found");
      return;
    }

    const applied = await getAppliedMigrations(sql);
    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      console.log(
        `[migrate] up to date (${applied.size} migration${applied.size === 1 ? "" : "s"} applied)`,
      );
      return;
    }

    console.log(
      `[migrate] applying ${pending.length} pending migration${pending.length === 1 ? "" : "s"}...`,
    );

    for (const file of pending) {
      await applyMigration(sql, file);
    }

    console.log("[migrate] done");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function ensureTrackingTable(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(TRACKING_TABLE)} (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
}

async function getAppliedMigrations(sql: postgres.Sql): Promise<Set<string>> {
  const rows = await sql<{ filename: string }[]>`
    SELECT filename FROM ${sql(TRACKING_TABLE)}
  `;
  return new Set(rows.map((row) => row.filename));
}

async function applyMigration(sql: postgres.Sql, filename: string) {
  const filepath = resolve(MIGRATIONS_DIR, filename);
  const content = await readFile(filepath, "utf8");

  const trimmed = content.trim();
  if (!trimmed) {
    console.log(`[migrate] ${filename} → empty, skipping`);
    await sql`INSERT INTO ${sql(TRACKING_TABLE)} (filename) VALUES (${filename})`;
    return;
  }

  process.stdout.write(`[migrate] ${filename} → applying... `);

  try {
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO ${tx(TRACKING_TABLE)} (filename) VALUES (${filename})`;
    });
    console.log("ok");
  } catch (error) {
    console.log("failed");
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`migration ${filename} failed: ${message}`);
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error.message ?? error}`);
  process.exit(1);
});
