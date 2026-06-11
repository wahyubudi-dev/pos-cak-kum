"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { carts, cartItems, orders, orderItems } from "@/lib/db/schema";

export type OrderActionState = {
  ok: boolean;
  message?: string;
};

const checkoutSchema = z.object({
  table_number: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

/**
 * Convert the current user's cart into an order.
 *
 * Wrapped in a Drizzle transaction so all three writes — order header,
 * order items, cart cleanup — succeed together or none at all. With
 * Drizzle + postgres-js this gives us proper atomicity, fixing the
 * non-atomic two-step pattern we had with the supabase-js client.
 *
 * Phase 1 status: 'pending_confirmation'. Admin verifies the static QR
 * payment manually before progressing the order.
 */
export async function createOrderFromCart(
  formData: FormData,
): Promise<OrderActionState> {
  const user = await requireAuth("/checkout");

  const parsed = checkoutSchema.safeParse({
    table_number: formData.get("table_number") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: "Nomor meja tidak valid" };
  }

  const cart = await db.query.carts.findFirst({
    columns: { id: true },
    where: eq(carts.userId, user.auth.id),
    with: {
      items: {
        with: {
          menu: {
            columns: {
              id: true,
              name: true,
              price: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { ok: false, message: "Keranjang kosong" };
  }

  const inactiveItems = cart.items.filter(
    (item) => !item.menu || !item.menu.isActive,
  );
  if (inactiveItems.length > 0) {
    return {
      ok: false,
      message:
        "Ada menu di keranjang yang sudah tidak tersedia. Hapus dulu sebelum bayar.",
    };
  }

  let totalAmount = 0;
  for (const item of cart.items) {
    if (!item.menu) continue;
    const unitPrice = item.unitPrice ? Number(item.unitPrice) : Number(item.menu.price);
    totalAmount += unitPrice * item.quantity;
  }

  let orderNumber: number;
  try {
    orderNumber = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          userId: user.auth.id,
          totalAmount: totalAmount.toString(),
          tableNumber: parsed.data.table_number,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      if (!created) throw new Error("Gagal membuat header pesanan");

      await tx.insert(orderItems).values(
        cart.items
          .filter((item) => item.menu)
          .map((item) => ({
            orderId: created.id,
            menuId: item.menuId,
            quantity: item.quantity,
            // Snapshot the price; historical orders never re-price.
            unitPrice: item.unitPrice ?? item.menu!.price,
            notes: item.notes,
            size: item.size,
          })),
      );

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      return created.orderNumber;
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal membuat pesanan",
    };
  }

  revalidatePath("/cart");
  revalidatePath("/menu");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  redirect(`/order/success?number=${orderNumber}`);
}

export async function cancelCheckout(): Promise<never> {
  await requireAuth("/checkout");
  redirect("/order/cancel");
}
