import type { OrderStatus } from "@/lib/db/schema";

/**
 * Indonesian display labels for every order status. Centralizing them here
 * keeps the dashboard, admin actions, and customer-facing pages in sync.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Menunggu konfirmasi",
  processing: "Sedang diproses",
  ready: "Sedang diantar",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

/**
 * Allowed forward transitions. Cancelled and completed are terminal.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/**
 * Status families for filtering / counting in the admin dashboard.
 */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "processing",
  "ready",
];

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "processing",
  "ready",
  "completed",
  "cancelled",
];
