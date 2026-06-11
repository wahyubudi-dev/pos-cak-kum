import type { OrderStatus } from "@/lib/db/schema";

/**
 * Shared shape for the admin orders dashboard. Lives in its own module so
 * both the Server Component (initial render) and the Server Action that
 * hydrates Realtime events can return the same structure.
 */
export type OrderItemView = {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  menuName: string;
};

export type CustomerView = {
  fullName: string | null;
  email: string;
};

export type OrderView = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  tableNumber: string | null;
  createdAt: string;
  customer: CustomerView | null;
  items: OrderItemView[];
};
