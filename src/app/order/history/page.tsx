import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  ChefHat,
  BellRing,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Receipt,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getOrdersByUser } from "@/lib/orders/queries";
import { requireAuth } from "@/lib/auth/session";
import {
  ORDER_STATUS_LABELS,
  ACTIVE_ORDER_STATUSES,
} from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/db/schema";

type SearchParams = Promise<{ table?: string }>;

export const metadata = {
  title: "Riwayat Pesanan · Kedai Cak Kum",
};

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireAuth("/login");
  const { table } = await searchParams;
  const tableNumber = table?.trim() || null;

  const orders = await getOrdersByUser(user.auth.id);

  const activeOrders = orders.filter((o) =>
    ACTIVE_ORDER_STATUSES.includes(o.status),
  );
  const pastOrders = orders.filter(
    (o) => !ACTIVE_ORDER_STATUSES.includes(o.status),
  );

  return (
    <main className="relative min-h-screen bg-background pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-brand-teal/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-mint-wash/30 blur-3xl" />
      </div>

      <div className="relative">
        <Header tableNumber={tableNumber} orderCount={orders.length} />

        {orders.length === 0 ? (
          <EmptyState tableNumber={tableNumber} />
        ) : (
          <div className="mx-auto max-w-lg px-5 pt-2 pb-8 sm:px-6">
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm">
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  <ClipboardList className="h-3 w-3" />
                  Total pesanan
                </span>
                <span className="mt-1 block font-display text-2xl font-bold tabular-nums text-foreground">
                  {orders.length}
                </span>
              </div>
              <div className="rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm">
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  <ChefHat className="h-3 w-3" />
                  Sedang aktif
                </span>
                <span className="mt-1 block font-display text-2xl font-bold tabular-nums text-foreground">
                  {activeOrders.length}
                </span>
              </div>
            </div>

            {activeOrders.length > 0 && (
              <SectionDivider label="Pesanan Aktif" />
            )}
            <div className="flex flex-col gap-3">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  tableNumber={tableNumber}
                />
              ))}
            </div>

            {pastOrders.length > 0 && (
              <div className="mt-6">
                <SectionDivider label="Riwayat" />
                <div className="flex flex-col gap-3">
                  {pastOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      tableNumber={tableNumber}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── sub-components ──────────────────────────────────────────── */

function Header({
  tableNumber,
  orderCount,
}: {
  tableNumber: string | null;
  orderCount: number;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={
              tableNumber
                ? `/menu?table=${encodeURIComponent(tableNumber)}`
                : "/menu"
            }
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-pearl hover:text-foreground"
            aria-label="Kembali ke menu"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-sm font-semibold text-foreground">
            Riwayat Pesanan
          </h1>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tableNumber }: { tableNumber: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pt-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-paper">
        <Receipt className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg font-semibold text-foreground">
          Belum ada pesanan
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {tableNumber
            ? `Belum ada pesanan dari Meja ${tableNumber}.`
            : "Kamu belum pernah memesan. Yuk pesan sekarang!"}
        </p>
      </div>
      <Button asChild size="cta" variant="primary" className="mt-2 text-xs shadow-subtle">
        <Link
          href={
            tableNumber
              ? `/menu?table=${encodeURIComponent(tableNumber)}`
              : "/menu"
          }
        >
          Pesan sekarang
        </Link>
      </Button>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-3 mt-2 flex items-center gap-2">
      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function OrderCard({
  order,
  tableNumber,
}: {
  order: Awaited<ReturnType<typeof getOrdersByUser>>[number];
  tableNumber: string | null;
}) {
  const accentColor = STATUS_ACCENT[order.status];

  return (
    <details className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all open:shadow-md">
      <summary className="relative flex cursor-pointer list-none items-center gap-2 px-5 py-4 [&::-webkit-details-marker]:hidden" style={{ "--accent": accentColor } as React.CSSProperties}>
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-base font-semibold text-foreground">
                #{String(order.orderNumber).padStart(3, "0")}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatDate(order.createdAt)}
              </span>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>{order.items.length} item</span>
              {order.tableNumber ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Meja {order.tableNumber}</span>
                </>
              ) : null}
            </span>
            <span className="text-sm font-semibold text-foreground">
              Rp{Number(order.totalAmount).toLocaleString("id-ID")}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>

      {/* expanded items */}
      <div className="border-t border-border px-5 py-3">
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[12px] font-medium text-foreground truncate">
                  {item.menu?.name ?? "Unknown"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.quantity}× Rp{Number(item.unitPrice).toLocaleString("id-ID")}
                  {item.notes ? ` · ${item.notes}` : ""}
                </span>
              </div>
              <span className="shrink-0 text-[12px] font-medium text-foreground">
                Rp{Number(item.subtotal).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        <Link
          href={`/order/success?number=${order.orderNumber}`}
          className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-border bg-cream-paper/40 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-cream-paper hover:text-foreground"
        >
          Lihat detail pesanan
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </details>
  );
}

/* ─── status helpers ──────────────────────────────────────────── */

const STATUS_ACCENT: Record<OrderStatus, string> = {
  pending_confirmation: "#f59e0b",
  processing: "#3b82f6",
  ready: "#10b981",
  completed: "#9ca3af",
  cancelled: "#ef4444",
};

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending_confirmation: <Clock className="h-3 w-3" />,
  processing: <ChefHat className="h-3 w-3" />,
  ready: <BellRing className="h-3 w-3" />,
  completed: <CheckCircle2 className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    pending_confirmation: "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-gray-50 text-gray-500 border-gray-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${colors[status]}`}
    >
      {STATUS_ICONS[status]}
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
