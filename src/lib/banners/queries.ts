import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import type { Banner } from "@/lib/db/schema";

/**
 * Customer-facing: active banners ordered by sort_order.
 */
export async function getActiveBanners(): Promise<Banner[]> {
  return db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(asc(banners.sortOrder), desc(banners.createdAt));
}

/**
 * Admin: all banners (including inactive), sorted by sort_order then newest.
 */
export async function getAllBannersForAdmin(): Promise<Banner[]> {
  return db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), desc(banners.createdAt));
}
