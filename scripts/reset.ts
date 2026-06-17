import { config } from "dotenv";
import postgres from "postgres";
import { createInterface } from "node:readline/promises";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[reset] DATABASE_URL must be set");
  process.exit(1);
}

const SKIP_CONFIRM = process.argv.includes("--yes") || process.argv.includes("-y");

async function confirm(): Promise<boolean> {
  if (SKIP_CONFIRM) return true;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    "[reset] This will DROP SCHEMA public CASCADE on the target database.\n" +
      "        ALL DATA will be permanently deleted.\n" +
      "        Type 'reset' to continue: ",
  );
  rl.close();
  return answer.trim() === "reset";
}

async function main() {
  const proceed = await confirm();
  if (!proceed) {
    console.log("[reset] aborted");
    return;
  }

  const sql = postgres(DATABASE_URL!, {
    prepare: false,
    max: 1,
    ssl: "require",
    onnotice: () => {},
  });

  try {
    console.log("[reset] dropping public schema...");
    await sql.unsafe(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO anon;
      GRANT ALL ON SCHEMA public TO authenticated;
      GRANT ALL ON SCHEMA public TO service_role;
    `);
    console.log("[reset] done. run 'npm run db:migrate' to rebuild.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(`[reset] ${error.message ?? error}`);
  process.exit(1);
});
