"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { carts, cartItems, orders } from "@/lib/db/schema";
import { getInvoice, expireInvoice, generateQrDataUrl, type XenditInvoice } from "@/lib/payments/xendit";

export type OrderActionState = {
  ok: boolean;
  message?: string;
};

export async function confirmPayment(
  orderId: string,
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireAuth("/checkout");

  const order = await db.query.orders.findFirst({
    columns: { id: true, paymentReference: true, orderNumber: true },
    where: and(eq(orders.id, orderId), eq(orders.userId, user.auth.id)),
  });

  if (!order) {
    return { ok: false, message: "Pesanan tidak ditemukan" };
  }
  if (!order.paymentReference) {
    return { ok: false, message: "Belum ada referensi pembayaran" };
  }

  const invoice = await getInvoice(order.paymentReference);
  console.log("[confirmPayment] orderId=%s invoiceStatus=%s", orderId, invoice.status);

  const paidStatuses: XenditInvoice["status"][] = ["PAID", "SETTLED"];

  if (paidStatuses.includes(invoice.status)) {
    const cart = await db.query.carts.findFirst({
      columns: { id: true },
      where: eq(carts.userId, user.auth.id),
    });

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status: "pending_confirmation",
          paidAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      if (cart) {
        await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
    });

    revalidatePath("/cart");
    revalidatePath("/menu");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");

    return { ok: true };
  }

  if (invoice.status === "EXPIRED") {
    const cart = await db.query.carts.findFirst({
      columns: { id: true },
      where: eq(carts.userId, user.auth.id),
    });

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, orderId));

      if (cart) {
        await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
    });

    revalidatePath("/cart");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");

    return { ok: false, message: "Pembayaran telah kedaluwarsa" };
  }

  return { ok: false, message: "Anda belum melakukan pembayaran, silakan lakukan pembayaran terlebih dahulu" };
}

export async function cancelCheckout(): Promise<never> {
  await requireAuth("/checkout");
  redirect("/order/cancel");
}

export async function cancelPendingPayment(
  orderId: string,
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireAuth("/checkout");

  const order = await db.query.orders.findFirst({
    columns: { id: true, userId: true, status: true, paymentReference: true },
    where: eq(orders.id, orderId),
  });

  if (!order || order.userId !== user.auth.id) {
    return { ok: false, message: "Pesanan tidak ditemukan" };
  }

  if (order.status !== "awaiting_payment") {
    return { ok: false, message: "Pesanan sudah diproses" };
  }

  // Expire invoice in Xendit first
  if (order.paymentReference) {
    await expireInvoice(order.paymentReference);
  }

  const cart = await db.query.carts.findFirst({
    columns: { id: true },
    where: eq(carts.userId, user.auth.id),
  });

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, orderId));

    if (cart) {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    }
  });

  revalidatePath("/cart");
  revalidatePath("/menu");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  return { ok: true };
}
