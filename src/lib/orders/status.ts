import type { OrderStatus } from "@/lib/db/schema";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Menunggu pembayaran",
  pending_confirmation: "Menunggu konfirmasi",
  processing: "Sedang diproses",
  ready: "Sedang diantar",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ["pending_confirmation", "cancelled"],
  pending_confirmation: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "awaiting_payment",
  "pending_confirmation",
  "processing",
  "ready",
];

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "awaiting_payment",
  "pending_confirmation",
  "processing",
  "ready",
  "completed",
  "cancelled",
];
