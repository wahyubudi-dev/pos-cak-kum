import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, menus, orderItems } from "@/lib/db/schema";
import type { Category, Menu } from "@/lib/db/schema";

export type CategoryWithMenus = Category & {
  menus: Menu[];
};

export type MenuWithCategory = Menu & {
  category: Pick<Category, "id" | "name" | "sortOrder"> | null;
};

export type MenuWithPopularity = Menu & {
  popularity: number;
};

export async function getCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

/**
 * Customer-facing list. Categories with no active menus are dropped so the
 * UI never renders an empty section.
 */
export async function getActiveMenusByCategory(): Promise<CategoryWithMenus[]> {
  const cats = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
    with: {
      menus: {
        where: eq(menus.isActive, true),
        orderBy: [asc(menus.name)],
      },
    },
  });

  return cats.filter((category) => category.menus.length > 0);
}

/**
 * Active menus grouped by category, augmented with a popularity score
 * (total quantity ordered across all-time orders). The score drives the
 * stacked-love indicator on the customer menu list — 1, 2, or 3 hearts.
 */
export async function getActiveMenusByCategoryWithPopularity(): Promise<
  (Category & { menus: MenuWithPopularity[] })[]
> {
  const cats = await getActiveMenusByCategory();
  const popularityMap = await getMenuPopularityMap();

  return cats.map((category) => ({
    ...category,
    menus: category.menus.map((menu) => ({
      ...menu,
      popularity: popularityMap.get(menu.id) ?? 0,
    })),
  }));
}

/**
 * Featured (admin-curated) active menus, ordered by popularity descending.
 * Used by the "Rekomendasi" section on the customer menu page.
 */
export async function getFeaturedMenus(
  limit = 8,
): Promise<MenuWithPopularity[]> {
  const rows = await db
    .select({
      id: menus.id,
      categoryId: menus.categoryId,
      name: menus.name,
      description: menus.description,
      price: menus.price,
      imageUrl: menus.imageUrl,
      isActive: menus.isActive,
      isFeatured: menus.isFeatured,
      createdAt: menus.createdAt,
      updatedAt: menus.updatedAt,
      popularity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(menus)
    .leftJoin(orderItems, eq(orderItems.menuId, menus.id))
    .where(and(eq(menus.isActive, true), eq(menus.isFeatured, true)))
    .groupBy(menus.id)
    .orderBy(desc(sql`coalesce(sum(${orderItems.quantity}), 0)`), asc(menus.name))
    .limit(limit);

  return rows;
}

/**
 * Admin list — includes inactive menus. Sorted newest first to surface
 * recent additions, with the category name eagerly loaded for display.
 */
export async function getAllMenusForAdmin(): Promise<MenuWithCategory[]> {
  const rows = await db.query.menus.findMany({
    orderBy: [desc(menus.createdAt)],
    with: {
      category: {
        columns: { id: true, name: true, sortOrder: true },
      },
    },
  });
  return rows;
}

export async function getMenuById(id: string): Promise<MenuWithCategory | null> {
  const row = await db.query.menus.findFirst({
    where: eq(menus.id, id),
    with: {
      category: {
        columns: { id: true, name: true, sortOrder: true },
      },
    },
  });
  return row ?? null;
}

/**
 * Map menu_id → total quantity ordered across all orders. Used to compute
 * the stacked-love indicator (1-3 hearts based on tier thresholds).
 */
async function getMenuPopularityMap(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      menuId: orderItems.menuId,
      total: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .groupBy(orderItems.menuId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.menuId, Number(row.total));
  }
  return map;
}
