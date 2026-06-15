import { and, desc, eq } from "drizzle-orm";

import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { carts, cartItems, orders, orderItems, type OrderStatus } from "@/lib/db/schema";
import { createInvoice, getInvoice, generateQrDataUrl } from "@/lib/payments/xendit";

export type PaymentOrderData = {
  orderId: string;
  orderNumber: number;
  totalAmount: number;
  tableNumber: string | null;
  invoiceUrl: string;
  qrImage: string;
  expiryDate: string;
  items: { name: string; quantity: number; size: string | null; notes: string | null; price: number }[];
};

export async function createOrderFromCartServer(
  tableNumber: string | null,
): Promise<PaymentOrderData> {
  const user = await requireAuth("/checkout");

  const cart = await db.query.carts.findFirst({
    columns: { id: true },
    where: eq(carts.userId, user.auth.id),
    with: {
      items: {
        with: {
          menu: {
            columns: { id: true, name: true, price: true, isActive: true },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Keranjang kosong");
  }

  const inactiveItems = cart.items.filter(
    (item) => !item.menu || !item.menu.isActive,
  );
  if (inactiveItems.length > 0) {
    throw new Error("Ada menu di keranjang yang sudah tidak tersedia");
  }

  let totalAmount = 0;
  for (const item of cart.items) {
    if (!item.menu) continue;
    const unitPrice = item.unitPrice ? Number(item.unitPrice) : Number(item.menu.price);
    totalAmount += unitPrice * item.quantity;
  }

  const result = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        userId: user.auth.id,
        status: "awaiting_payment",
        totalAmount: totalAmount.toString(),
        tableNumber,
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
          unitPrice: item.unitPrice ?? item.menu!.price,
          notes: item.notes,
          size: item.size,
        })),
    );

    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    return created;
  });

  const invoice = await createInvoice({
    externalId: result.id,
    amount: totalAmount,
    description: `Cak Kum OrderId: #${result.id}`,
    successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?number=${result.orderNumber}`,
    customer: {
      givenNames: user.auth.email?.split("@")[0] ?? "Customer",
      email: user.auth.email ?? undefined,
    },
  });

  const qrImage = await generateQrDataUrl(invoice.qr_string || invoice.invoice_url);

  await db
    .update(orders)
    .set({
      paymentReference: invoice.id,
      paymentChannel: "QRIS",
      paymentExpiry: new Date(invoice.expiry_date),
    })
    .where(eq(orders.id, result.id));

  return {
    orderId: result.id,
    orderNumber: result.orderNumber,
    totalAmount,
    tableNumber,
    invoiceUrl: invoice.invoice_url,
    qrImage,
    expiryDate: invoice.expiry_date,
    items: cart.items
      .filter((i) => i.menu)
      .map((i) => ({
        name: i.menu!.name,
        quantity: i.quantity,
        size: i.size,
        notes: i.notes,
        price: Number(i.unitPrice ?? i.menu!.price),
      })),
  };
}

export async function getPendingPaymentOrder(): Promise<PaymentOrderData | null> {
  const user = await requireAuth("/checkout");

  const order = await db.query.orders.findFirst({
    columns: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      tableNumber: true,
      paymentReference: true,
      paymentExpiry: true,
    },
    where: and(
      eq(orders.userId, user.auth.id),
      eq(orders.status, "awaiting_payment" satisfies OrderStatus),
    ),
    orderBy: desc(orders.createdAt),
    with: {
      items: {
        columns: { quantity: true, unitPrice: true, notes: true, size: true },
        with: {
          menu: { columns: { name: true } },
        },
      },
    },
  });

  if (!order || !order.paymentReference) return null;

  const invoice = await getInvoice(order.paymentReference);

  // If invoice is no longer pending, clean up the order and return null
  if (invoice.status === "EXPIRED") {
    const cart = await db.query.carts.findFirst({
      columns: { id: true },
      where: eq(carts.userId, user.auth.id),
    });

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, order.id));

      if (cart) {
        await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
    });

    return null;
  }

  const paidStatuses = ["SETTLED", "PAID", "SUCCEEDED"];
  if (paidStatuses.includes(invoice.status)) {
    await db
      .update(orders)
      .set({
        status: "pending_confirmation",
        paidAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    return null;
  }

  const qrImage = await generateQrDataUrl(invoice.qr_string || invoice.invoice_url);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalAmount: Number(order.totalAmount),
    tableNumber: order.tableNumber,
    invoiceUrl: invoice.invoice_url,
    qrImage,
    expiryDate: invoice.expiry_date,
    items: order.items.map((i) => ({
      name: i.menu.name,
      quantity: i.quantity,
      size: i.size,
      notes: i.notes,
      price: Number(i.unitPrice),
    })),
  };
}
