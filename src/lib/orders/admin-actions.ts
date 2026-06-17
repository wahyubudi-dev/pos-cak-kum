"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/db/schema";

export type AdminOrderActionState = {
  ok: boolean;
  message?: string;
};

function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<AdminOrderActionState> {
  await requireAdmin();

  const current = await db.query.orders.findFirst({
    columns: { status: true },
    where: eq(orders.id, orderId),
  });

  if (!current) return { ok: false, message: "Pesanan tidak ditemukan" };

  if (!isValidTransition(current.status, nextStatus)) {
    return {
      ok: false,
      message: `Tidak bisa mengubah status dari "${ORDER_STATUS_LABELS[current.status]}" ke "${ORDER_STATUS_LABELS[nextStatus]}".`,
    };
  }

  try {
    await db
      .update(orders)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  } catch (error) {
    console.error("[updateOrderStatus]", error);
    return {
      ok: false,
      message: "Gagal menyimpan",
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Status diubah ke "${ORDER_STATUS_LABELS[nextStatus]}"`,
  };
}

export async function cancelOrder(
  orderId: string,
): Promise<AdminOrderActionState> {
  return updateOrderStatus(orderId, "cancelled");
}
