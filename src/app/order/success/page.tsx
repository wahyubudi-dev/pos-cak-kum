import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, Clock, ChefHat, BellRing, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getOrderByOrderNumber } from "@/lib/orders/queries";
import { getInvoice } from "@/lib/payments/xendit";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/db/schema";

type SearchParams = Promise<{ number?: string }>;

export const metadata = {
  title: "Detail Pesanan · Kedai Cak Kum",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { number } = await searchParams;

  if (!number) notFound();

  const orderNumber = parseInt(number, 10);
  if (Number.isNaN(orderNumber)) notFound();

  const order = await getOrderByOrderNumber(orderNumber);
  if (!order) notFound();

  // Verify Xendit status if still awaiting payment
  if (order.status === "awaiting_payment" && order.paymentReference) {
    const invoice = await getInvoice(order.paymentReference);

    if (invoice.status === "PAID" || invoice.status === "SETTLED") {
      await db
        .update(orders)
        .set({ status: "pending_confirmation", paidAt: new Date() })
        .where(eq(orders.id, order.id));
    } else if (invoice.status === "EXPIRED") {
      await db
        .update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, order.id));
      redirect(`/order/cancel?number=${number}`);
    } else if (invoice.status === "PENDING") {
      redirect("/checkout");
    }

    // Re-fetch to get updated status
    const updated = await getOrderByOrderNumber(orderNumber);
    if (updated) Object.assign(order, updated);
  } else if (order.status === "awaiting_payment" && !order.paymentReference) {
    redirect("/checkout");
  }

  const isCancelled = order.status === "cancelled";
  const formattedNumber = `#${number.padStart(3, "0")}`;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-14 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-brand-teal/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-mint-wash/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-7 sm:py-12">
        {/* status icon */}
        {isCancelled ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 shadow-sm">
            <X className="h-6 w-6 text-red-600 sm:h-7 sm:w-7" strokeWidth={3} />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal shadow-subtle">
            <Check className="h-6 w-6 text-white sm:h-7 sm:w-7" strokeWidth={3} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[22px] font-semibold tracking-tight sm:text-[26px]">
            {isCancelled ? "Pesanan dibatalkan" : "Pesanan diterima"}
          </h1>
          <p className="text-[11px] text-muted-foreground px-2">
            {isCancelled
              ? "Pesanan ini telah dibatalkan."
              : "Terima kasih sudah memesan di Cak Kum. Tim dapur akan memverifikasi pembayaran lalu mulai menyiapkan pesanan kamu."}
          </p>
        </div>

        {order.tableNumber ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream-paper/60 px-3 py-1 text-[11px] font-semibold text-foreground">
            Meja {order.tableNumber}
          </span>
        ) : null}

        <div className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-cream-paper/50 px-5 py-4">
          <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
            Nomor pesanan
          </span>
          <span className="font-display text-[28px] font-bold tabular-nums text-foreground sm:text-[32px]">
            {formattedNumber}
          </span>
        </div>

        {/* dynamic status timeline */}
        <div className="flex w-full flex-col gap-3 text-left">
          <TimelineStep
            step={1}
            status={order.status}
            label="Pembayaran diverifikasi"
            desc="Staf akan cek pembayaran kamu"
          />
          <div
            className="ml-2.5 h-4 w-0.5 rounded-full"
            style={{ backgroundColor: connectorColor(1, order.status) ? "var(--color-brand-teal)" : "var(--color-border)" }}
          />
          <TimelineStep
            step={2}
            status={order.status}
            label="Pesanan dimasak"
            desc="Tim dapur mulai menyiapkan"
          />
          <div
            className="ml-2.5 h-4 w-0.5 rounded-full"
            style={{ backgroundColor: connectorColor(2, order.status) ? "var(--color-brand-teal)" : "var(--color-border)" }}
          />
          <TimelineStep
            step={3}
            status={order.status}
            label="Siap disajikan"
            desc="Pesanan diantar ke meja kamu"
          />
        </div>

        {/* status card */}
        <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-white px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Status
            </span>
            <StatusDot status={order.status} />
          </div>
          <span className="text-[13px] font-semibold text-foreground">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Tunjukkan halaman ini ke staf jika diminta. Kamu juga bisa pesan
          tambahan kapan pun.
        </p>

        <Button
          asChild
          size="cta"
          variant="primary"
          className="w-full text-xs shadow-subtle hover:-translate-y-0.5 active:translate-y-0"
        >
          <Link href="/menu">Pesan lagi</Link>
        </Button>
      </div>
    </main>
  );
}

/* ─── Timeline Step ──────────────────────────────────────────── */

function TimelineStep({
  step,
  status,
  label,
  desc,
}: {
  step: 1 | 2 | 3;
  status: OrderStatus;
  label: string;
  desc: string;
}) {
  const checked = isStepCompleted(step, status);
  const cancelled = status === "cancelled" && step === 1;

  if (cancelled) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
          <X className="h-3 w-3 text-red-600" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-medium text-red-600">
            Pesanan dibatalkan
          </span>
          <span className="text-[10px] text-muted-foreground">{desc}</span>
        </div>
      </div>
    );
  }

  if (checked) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-teal/10">
          <Check className="h-3 w-3 text-brand-teal" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-medium text-foreground">
            {label}
          </span>
          <span className="text-[10px] text-muted-foreground">{desc}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground">{desc}</span>
      </div>
    </div>
  );
}

/* ─── helpers ────────────────────────────────────────────────── */

function isStepCompleted(step: 1 | 2 | 3, status: OrderStatus): boolean {
  if (status === "cancelled") return false;

  switch (step) {
    case 1:
      return true; // always checked for non-cancelled
    case 2:
      return ["processing", "ready", "completed"].includes(status);
    case 3:
      return status === "completed";
  }
}

function connectorColor(stepIndex: 1 | 2, status: OrderStatus): boolean {
  // Connector after step 1 is green if step 2 is completed
  // Connector after step 2 is green if step 3 is completed
  return isStepCompleted((stepIndex + 1) as 2 | 3, status);
}

function StatusDot({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
        <X className="h-3 w-3 text-red-600" strokeWidth={2.5} />
      </div>
    );
  }

  const colorMap: Record<OrderStatus, string> = {
    awaiting_payment: "bg-amber-400",
    pending_confirmation: "bg-sky-400",
    processing: "bg-violet-500",
    ready: "bg-emerald-500",
    completed: "bg-brand-teal",
    cancelled: "",
  };

  return <div className={`h-2.5 w-2.5 rounded-full ${colorMap[status]}`} />;
}
