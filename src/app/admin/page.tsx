import Link from "next/link";

import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { formatRupiah } from "@/lib/format";
import {
  getActiveOrdersCount,
  getAllOrdersForAdmin,
  getTodayStats,
} from "@/lib/orders/queries";

export const metadata = {
  title: "Dashboard · Admin Cak Kum",
};

const TIME_FORMAT = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminDashboardPage() {
  const [admin, activeCount, todayStats, recentOrders] = await Promise.all([
    requireAdmin(),
    getActiveOrdersCount(),
    getTodayStats(),
    getAllOrdersForAdmin({ limit: 5 }),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Halo, {admin.fullName?.split(" ")[0] ?? "Cak"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Berikut ringkasan kegiatan Kedai Cak Kum hari ini.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Pesanan aktif"
          value={String(activeCount)}
          hint="Menunggu, diproses, atau siap diambil"
          accent="bg-cream-paper"
        />
        <StatCard
          label="Pesanan hari ini"
          value={String(todayStats.count)}
          hint="Termasuk yang dibatalkan"
        />
        <StatCard
          label="Pendapatan hari ini"
          value={formatRupiah(todayStats.revenue)}
          hint="Belum termasuk pesanan dibatalkan"
          accent="bg-mint-wash"
        />
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold">
              Pesanan terbaru
            </h2>
            <p className="text-xs text-muted-foreground">
              Lima pesanan paling baru. Buka halaman pesanan untuk lihat
              semuanya secara real-time.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="rounded-lg"
          >
            <Link href="/admin/orders">Lihat semua →</Link>
          </Button>
        </header>

        {recentOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-pearl px-4 py-6 text-center text-sm text-muted-foreground">
            Belum ada pesanan masuk.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-semibold tabular-nums">
                      #{String(order.orderNumber).padStart(3, "0")}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    {order.tableNumber ? (
                      <span className="rounded-full bg-cream-paper px-2 py-0.5 text-xs font-medium">
                        Meja {order.tableNumber}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {TIME_FORMAT.format(order.createdAt)} ·{" "}
                    {order.customer?.fullName ?? order.customer?.email ?? "-"}
                  </span>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatRupiah(Number(order.totalAmount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          href="/admin/menus"
          title="Kelola menu"
          description="Tambah menu baru, ganti gambar, atau nonaktifkan menu yang habis."
        />
        <QuickLink
          href="/admin/categories"
          title="Kelola kategori"
          description="Atur kategori dan urutannya supaya mudah ditemukan pelanggan."
        />
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-3xl border border-border bg-card p-6">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={
          accent
            ? `inline-flex w-fit rounded-2xl px-3 py-1 font-display text-2xl font-semibold tabular-nums ${accent}`
            : "font-display text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-pearl"
    >
      <span className="font-display text-lg font-semibold">{title} →</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </Link>
  );
}
