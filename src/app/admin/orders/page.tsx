import { OrdersDashboard, type OrderView } from "@/components/admin/orders-dashboard";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import {
  countAllOrdersForAdmin,
  getAllOrdersForAdmin,
} from "@/lib/orders/queries";

export const metadata = {
  title: "Pesanan · Admin Cak Kum",
};

function todayString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

type SearchParams = Promise<{
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
  search?: string;
}>;

export default async function AdminOrdersPage(props: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const {
    startDate: startParam,
    endDate: endParam,
    page: pageParam,
    limit: limitParam,
    search: searchParam,
  } = await props.searchParams;

  const startDate = startParam ?? todayString();
  const endDate = endParam ?? todayString();
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitParam) || 10));
  const search = searchParam?.trim() ?? "";

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const endOfDay = new Date(end);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const totalCount = await countAllOrdersForAdmin({
    search: search || undefined,
    startDate: start,
    endDate: endOfDay,
  });

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.min(page, Math.max(totalPages, 1));

  const orders = await getAllOrdersForAdmin({
    limit,
    offset: (currentPage - 1) * limit,
    search: search || undefined,
    startDate: start,
    endDate: endOfDay,
  });

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
    <div className="flex flex-col gap-7 py-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Pesanan
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau pesanan masuk secara real-time. Verifikasi pembayaran lalu
            proses pesanan pelanggan.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            className="h-7 rounded-lg border border-border bg-white px-2.5 text-xs shadow-sm"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            className="h-7 rounded-lg border border-border bg-white px-2.5 text-xs shadow-sm"
          />
          <Button
            type="submit"
            size="sm"
            variant="default"
            className="rounded-lg text-xs"
          >
            Terapkan
          </Button>
        </form>
      </header>

      <OrdersDashboard
        initialOrders={initialOrders}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        search={search}
        limit={limit}
      />
    </div>
  );
}
