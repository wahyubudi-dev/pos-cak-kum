"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from "@/lib/orders/status";
import { updateOrderStatus } from "@/lib/orders/admin-actions";
import { formatRupiah } from "@/lib/format";
import type { OrderStatus } from "@/lib/db/schema";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  menuName: string;
};

type Customer = {
  fullName: string | null;
  email: string;
};

type AdminOrderRowProps = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  tableNumber: string | null;
  createdAt: string;
  customer: Customer | null;
  items: OrderItem[];
};

const TIME_FORMAT = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "short",
});

/**
 * Single order card on the admin dashboard. Stays a Client Component
 * because status mutations + optimistic UI both run client-side.
 */
export function AdminOrderRow({
  id,
  orderNumber,
  status,
  totalAmount,
  tableNumber,
  createdAt,
  customer,
  items,
}: AdminOrderRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[status];
  const formattedTime = TIME_FORMAT.format(new Date(createdAt));
  const formattedNumber = `#${String(orderNumber).padStart(3, "0")}`;

  function handleTransition(next: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatus(id, next);
      if (result.ok) toast.success(result.message ?? "Status diperbarui");
      else toast.error(result.message ?? "Gagal mengubah status");
    });
  }

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-semibold tabular-nums">
              {formattedNumber}
            </span>
            <OrderStatusBadge status={status} />
            {tableNumber ? (
              <span className="rounded-full bg-cream-paper px-2.5 py-0.5 text-xs font-medium text-foreground">
                Meja {tableNumber}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{formattedTime}</span>
            {customer ? (
              <span>· {customer.fullName ?? customer.email}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-display text-xl font-semibold tabular-nums">
            {formatRupiah(totalAmount)}
          </span>
          <span className="text-xs text-muted-foreground">
            {items.length} item · {items.reduce((sum, i) => sum + i.quantity, 0)} pcs
          </span>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="self-start text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? "Sembunyikan detail" : "Lihat detail pesanan"}
      </button>

      {isExpanded ? (
        <ul className="flex flex-col gap-2 rounded-xl bg-pearl px-4 py-3 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-foreground">
                  {item.menuName}
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                </span>
                {item.notes ? (
                  <span className="text-xs text-muted-foreground">
                    Catatan: {item.notes}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 font-medium tabular-nums">
                {formatRupiah(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {allowedTransitions.length > 0 ? (
        <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Ubah status:</span>
          {allowedTransitions.map((next) => {
            const isCancel = next === "cancelled";
            return (
              <Button
                key={next}
                type="button"
                size="sm"
                variant={isCancel ? "ghost" : "default"}
                disabled={isPending}
                onClick={() => handleTransition(next)}
                className={
                  isCancel
                    ? "rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : "rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90"
                }
              >
                {ORDER_STATUS_LABELS[next]}
              </Button>
            );
          })}
        </footer>
      ) : null}
    </article>
  );
}
