import { OrdersDashboard, type OrderView } from "@/components/admin/orders-dashboard";
import { getAllOrdersForAdmin } from "@/lib/orders/queries";

export const metadata = {
  title: "Pesanan · Admin Cak Kum",
};

/**
 * Admin orders page. Renders the initial snapshot server-side, then hands
 * control to the live OrdersDashboard which subscribes to Realtime updates.
 */
export default async function AdminOrdersPage() {
  const orders = await getAllOrdersForAdmin();

  const initialOrders: OrderView[] = orders.map((order) => ({
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
  }));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-7 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Pesanan
        </h1>
        <p className="text-sm text-muted-foreground">
          Pantau pesanan masuk secara real-time. Verifikasi pembayaran lalu
          ubah status menjadi diproses, siap, atau selesai.
        </p>
      </header>

      <OrdersDashboard initialOrders={initialOrders} />
    </main>
  );
}
