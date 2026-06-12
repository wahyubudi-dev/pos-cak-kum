import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { ACTIVE_ORDER_STATUSES } from "@/lib/orders/status";
import type {
  Menu,
  Order,
  OrderItem,
  OrderStatus,
  User,
} from "@/lib/db/schema";

export type AdminOrderItem = Pick<
  OrderItem,
  "id" | "quantity" | "unitPrice" | "subtotal" | "notes"
> & {
  menu: Pick<Menu, "id" | "name"> | null;
};

export type AdminOrder = Order & {
  customer: Pick<User, "id" | "fullName" | "email"> | null;
  items: AdminOrderItem[];
};

export async function getAllOrdersForAdmin(options?: {
  status?: OrderStatus | "all";
  limit?: number;
}): Promise<AdminOrder[]> {
  const status = options?.status;

  const rows = await db.query.orders.findMany({
    where: status && status !== "all" ? eq(orders.status, status) : undefined,
    orderBy: [desc(orders.createdAt)],
    limit: options?.limit,
    with: {
      customer: {
        columns: { id: true, fullName: true, email: true },
      },
      items: {
        columns: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          notes: true,
          size: true,
        },
        with: {
          menu: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });

  return rows;
}

export async function getActiveOrdersCount(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(orders)
    .where(inArray(orders.status, ACTIVE_ORDER_STATUSES));

  return row?.value ?? 0;
}

/**
 * Today's order count + revenue (cancelled excluded). "Today" = since local
 * midnight in the server's timezone — sufficient for a single-outlet POS.
 */
export async function getTodayStats(): Promise<{
  count: number;
  revenue: number;
}> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      total: count(),
    })
    .from(orders)
    .where(gte(orders.createdAt, startOfToday));

  const revenueRows = await db
    .select({
      value: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startOfToday),
        sql`${orders.status} <> 'cancelled'`,
      ),
    );

  return {
    count: rows[0]?.total ?? 0,
    revenue: Number(revenueRows[0]?.value ?? 0),
  };
}

/**
 * Fetch orders for the current customer by user ID. Includes item snapshots
 * with menu names. Ordered newest-first.
 */
export type DailyRevenue = {
  day: string;
  orderCount: number;
  revenue: number;
};

export async function getDailyRevenue(
  startDate: Date,
  endDate: Date,
): Promise<DailyRevenue[]> {
  const endOfDay = new Date(endDate);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`DATE(${orders.createdAt})`,
      orderCount: count(),
      totalAmount: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endOfDay),
        sql`${orders.status} <> 'cancelled'`,
      ),
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  return rows.map((r) => ({
    day: r.day,
    orderCount: r.orderCount,
    revenue: Number(r.totalAmount),
  }));
}

export type StatusDistribution = {
  status: string;
  count: number;
};

export async function getOrderStatusDistribution(
  startDate: Date,
  endDate: Date,
): Promise<StatusDistribution[]> {
  const endOfDay = new Date(endDate);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endOfDay),
      ),
    )
    .groupBy(orders.status)
    .orderBy(orders.status);

  return rows;
}

export async function getOrdersByUser(
  userId: string,
  options?: {
    tableNumber?: string | null;
    limit?: number;
  },
) {
  const filters = [eq(orders.userId, userId)];

  if (options?.tableNumber) {
    filters.push(eq(orders.tableNumber, options.tableNumber));
  }

  const rows = await db.query.orders.findMany({
    where: and(...filters),
    orderBy: [desc(orders.createdAt)],
    limit: options?.limit ?? 20,
    with: {
      items: {
        columns: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          notes: true,
          size: true,
        },
        with: {
          menu: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });

  return rows;
}

/**
 * Fetch a customer-facing order by its sequential order number.
 * Returns minimal data needed for the order success / tracking page.
 */
export async function getOrderByOrderNumber(
  orderNumber: number,
): Promise<AdminOrder | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: {
      customer: {
        columns: { id: true, fullName: true, email: true },
      },
      items: {
        columns: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          notes: true,
          size: true,
        },
        with: {
          menu: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });

  return row ?? null;
}

/**
 * Fetch a single order with joins, shaped for the admin dashboard view.
 * Used by Realtime INSERT handlers to hydrate newly-created orders without
 * giving the browser direct DB access.
 */
export async function getOrderById(id: string): Promise<AdminOrder | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      customer: {
        columns: { id: true, fullName: true, email: true },
      },
      items: {
        columns: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          notes: true,
          size: true,
        },
        with: {
          menu: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });

  return row ?? null;
}
