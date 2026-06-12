"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { AdminOrderRow } from "@/components/admin/order-row";
import { Button } from "@/components/ui/button";
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from "@/lib/orders/status";
import { fetchAdminOrderView } from "@/lib/orders/dashboard-actions";
import type { OrderView } from "@/lib/orders/views";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/db/schema";

export type { OrderView } from "@/lib/orders/views";

type StatusFilter = OrderStatus | "all";

type OrdersDashboardProps = {
  initialOrders: OrderView[];
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  ...ALL_ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

/**
 * Live admin orders dashboard.
 *
 * Server hands us a fully-hydrated initial page, then we subscribe to the
 * orders table so new orders, status updates, and cancellations show up
 * without a manual refresh.
 *
 * Realtime payload carries only the orders row, so we either:
 *   1. INSERT: call a Server Action (Drizzle-backed) to fetch the order
 *      with joins and prepend.
 *   2. UPDATE: patch the mutable fields (status, total) in place — no
 *      re-fetch needed because items + customer are immutable post-create.
 *
 * Direct DB queries from the browser are intentionally avoided. supabase-js
 * is used only for the Realtime subscription transport, not for data fetch.
 */
export function OrdersDashboard({ initialOrders }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<OrderView[]>(initialOrders);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const supabase = useMemo(() => createClient(), []);

  const fetchOrderById = useCallback(
    async (id: string): Promise<OrderView | null> => {
      try {
        return await fetchAdminOrderView(id);
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const newId = (payload.new as { id?: string })?.id;
          if (!newId) return;
          const order = await fetchOrderById(newId);
          if (!order) return;

          setOrders((current) => {
            if (current.some((existing) => existing.id === order.id)) return current;
            return [order, ...current];
          });

          toast.success(`Pesanan baru #${String(order.orderNumber).padStart(3, "0")}`);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as {
            id?: string;
            status?: OrderStatus;
            total_amount?: number;
          };
          if (!updated.id) return;

          setOrders((current) =>
            current.map((order) =>
              order.id === updated.id
                ? {
                    ...order,
                    status: updated.status ?? order.status,
                    totalAmount:
                      updated.total_amount !== undefined
                        ? Number(updated.total_amount)
                        : order.totalAmount,
                  }
                : order,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchOrderById]);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  return (
    <div className="flex flex-col gap-6">
      <FilterTabs value={filter} onChange={setFilter} orders={orders} />

      {filteredOrders.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredOrders.map((order) => (
            <li key={order.id}>
              <AdminOrderRow
                {...order}
                onStatusChange={(newStatus) =>
                  setOrders((prev) =>
                    prev.map((o) =>
                      o.id === order.id ? { ...o, status: newStatus } : o,
                    ),
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterTabs({
  value,
  onChange,
  orders,
}: {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
  orders: OrderView[];
}) {
  const counts = useMemo(() => {
    const map: Record<StatusFilter, number> = {
      all: orders.length,
      pending_confirmation: 0,
      processing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      map[order.status] += 1;
    }
    return map;
  }, [orders]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {FILTER_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(option.value)}
            className={
              isActive
                ? "shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
                : "shrink-0 rounded-full"
            }
          >
            {option.label}
            <span
              className={
                isActive
                  ? "ml-2 rounded-full bg-background/20 px-1.5 text-xs"
                  : "ml-2 rounded-full bg-muted px-1.5 text-xs text-muted-foreground"
              }
            >
              {counts[option.value]}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

function EmptyState({ filter }: { filter: StatusFilter }) {
  const message =
    filter === "all"
      ? "Belum ada pesanan masuk hari ini."
      : `Belum ada pesanan dengan status "${ORDER_STATUS_LABELS[filter as OrderStatus]}".`;

  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold text-foreground">
        Tidak ada pesanan
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
