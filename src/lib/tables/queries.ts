import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import type { Table } from "@/lib/db/schema";

/**
 * Admin: all tables (including inactive), sorted by label.
 */
export async function getAllTables(): Promise<Table[]> {
  return db
    .select()
    .from(tables)
    .orderBy(asc(tables.label));
}

/**
 * Customer-facing: only active tables, sorted by label.
 */
export async function getActiveTables(): Promise<Table[]> {
  return db
    .select()
    .from(tables)
    .where(eq(tables.isActive, true))
    .orderBy(asc(tables.label));
}
