import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/db/schema";

const STATUS_STYLES: Record<OrderStatus, string> = {
  awaiting_payment:
    "bg-cream-paper text-foreground border-border",
  pending_confirmation:
    "bg-sky-50 text-sky-700 border-sky-200",
  processing:
    "bg-violet-50 text-violet-700 border-violet-200",
  ready:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed:
    "bg-foreground text-background border-foreground",
  cancelled:
    "bg-destructive/10 text-destructive border-destructive/20",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

/**
 * Color-coded status pill used in the admin orders dashboard. Status colors
 * follow PRD section 9.4: warm cream for pending, teal for processing/ready,
 * dark for completed, destructive red for cancelled.
 */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
