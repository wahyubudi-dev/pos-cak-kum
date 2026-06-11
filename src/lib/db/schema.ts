import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema — TypeScript mirror of /supabase/migrations/0001_init.sql.
 *
 * Source of truth for table shapes. RLS policies, triggers, storage buckets,
 * and Realtime publications stay in raw SQL because Drizzle Kit doesn't
 * generate them. When you change anything here, run `npm run db:generate`
 * to produce a migration under /drizzle/migrations.
 */

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_confirmation",
  "processing",
  "ready",
  "completed",
  "cancelled",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().notNull(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_role_idx").on(table.role)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("categories_sort_order_idx").on(table.sortOrder)],
);

export const menus = pgTable(
  "menus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("menus_category_idx").on(table.categoryId),
    index("menus_is_active_idx").on(table.isActive),
    index("menus_is_featured_idx").on(table.isFeatured),
  ],
);

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("cart_items_cart_idx").on(table.cartId),
    unique().on(table.cartId, table.menuId, table.notes),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * Human-friendly running number (#001, #002, ...). Backed by a Postgres
     * sequence created in 0001_init.sql; Drizzle Kit will preserve the
     * existing default during migrations.
     */
    orderNumber: integer("order_number")
      .notNull()
      .unique()
      .default(sql`nextval('public.order_number_seq')`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status")
      .notNull()
      .default("pending_confirmation"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    tableNumber: text("table_number"),
    paymentReference: text("payment_reference"),
    paymentMethod: text("payment_method"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt.desc()),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    /**
     * GENERATED ALWAYS AS (quantity * unit_price) STORED in the database.
     * Drizzle has no native generated-column primitive yet — we mark it
     * with a SQL default so insert types treat it as optional, but
     * Postgres will compute the real value and reject any provided value.
     * Never include this in an insert payload.
     */
    subtotal: numeric("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default(sql`0`),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

import { relations } from "drizzle-orm";

/**
 * Banners — promotional carousel slides managed from admin panel.
 * Supports two display modes:
 *   - "content": headline + description + bg color + optional CTA
 *   - "image": full-bleed image (imageUrl required)
 * Admin can toggle highlight (bold outline) and active state.
 */
export const bannerDisplayEnum = pgEnum("banner_display", ["content", "image"]);

export const banners = pgTable(
  "banners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    /** Background color CSS value for "content" display mode */
    bgColor: text("bg_color").notNull().default("#fff8e5"),
    /** Full image URL for "image" display mode */
    imageUrl: text("image_url"),
    /** Display mode: "content" (text+bg) or "image" (full-bleed image) */
    displayMode: bannerDisplayEnum("display_mode").notNull().default("content"),
    /** Optional CTA button text */
    ctaText: text("cta_text"),
    /** Optional CTA link href */
    ctaHref: text("cta_href"),
    /** Whether banner has a highlight border/glow effect */
    isHighlighted: boolean("is_highlighted").notNull().default(false),
    /** Whether banner is shown to customers */
    isActive: boolean("is_active").notNull().default(true),
    /** Sort order — lower = shown first */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("banners_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  cart: one(carts, { fields: [users.id], references: [carts.userId] }),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  menus: many(menus),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  category: one(categories, {
    fields: [menus.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  menu: one(menus, { fields: [cartItems.menuId], references: [menus.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menu: one(menus, { fields: [orderItems.menuId], references: [menus.id] }),
}));

/**
 * Tables — master data for dine-in table labels (M01, VIP01, etc.).
 * Admin manages these via /admin/tables.
 */
export const tables = pgTable(
  "tables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("tables_active_idx").on(table.isActive)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type BannerDisplay = (typeof bannerDisplayEnum.enumValues)[number];

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;
