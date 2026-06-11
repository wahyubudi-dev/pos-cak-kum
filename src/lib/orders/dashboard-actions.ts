"use server";

import { requireAdmin } from "@/lib/auth/session";
import { getOrderById } from "@/lib/orders/queries";
import type { OrderView } from "@/lib/orders/views";

/**
 * Server-side helper invoked from the realtime client component when a
 * new order INSERT event arrives. The Realtime payload only carries the
 * orders row — we re-fetch with joins via Drizzle to hydrate the view,
 * keeping all DB access on the server.
 */
export async function fetchAdminOrderView(
  id: string,
): Promise<OrderView | null> {
  await requireAdmin();
  const order = await getOrderById(id);
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    tableNumber: order.tableNumber,
    createdAt: order.createdAt.toISOString(),
    customer: order.customer
      ? {
          fullName: order.customer.fullName,
          email: order.customer.email,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      notes: item.notes,
      menuName: item.menu?.name ?? "Menu tidak tersedia",
    })),
  };
}
