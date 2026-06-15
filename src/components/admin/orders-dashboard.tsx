"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";

export type { OrderView } from "@/lib/orders/views";

type StatusFilter = OrderStatus | "all";

type OrdersDashboardProps = {
  initialOrders: OrderView[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  search: string;
  limit: number;
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  ...ALL_ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

export function OrdersDashboard({
  initialOrders,
  currentPage,
  totalPages,
  totalCount,
  search,
  limit,
}: OrdersDashboardProps) {
  const [orders, setOrders] = useState<OrderView[]>(initialOrders);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchValue, setSearchValue] = useState(search);
  const router = useRouter();
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

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

  function goToPage(page: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    router.push(`/admin/orders?${params.toString()}`);
  }

  function handleSearch(value: string) {
    setSearchValue(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/admin/orders?${params.toString()}`);
    }, 400);
  }

  function handleLimitChange(newLimit: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  }

  const from = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, totalCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Cari nomor order atau nama pelanggan…"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-9 max-w-xs rounded-lg text-sm"
        />
        <span className="text-xs text-muted-foreground">
          {totalCount > 0
            ? `${from}–${to} dari ${totalCount} pesanan`
            : "Tidak ada pesanan"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Tampilkan</label>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="h-7 rounded-lg border border-border bg-white px-2 text-xs shadow-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

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

      {totalPages > 0 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="rounded-lg"
          >
            Sebelumnya
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                Math.abs(p - currentPage) <= 2,
            )
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 ? (
                  <span className="px-1 text-xs text-muted-foreground">…</span>
                ) : null}
                <Button
                  type="button"
                  variant={p === currentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => goToPage(p)}
                  className={
                    p === currentPage
                      ? "min-w-9 rounded-lg bg-foreground text-background"
                      : "min-w-9 rounded-lg"
                  }
                >
                  {p}
                </Button>
              </span>
            ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="rounded-lg"
          >
            Selanjutnya
          </Button>
        </div>
      ) : null}
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
      awaiting_payment: 0,
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
