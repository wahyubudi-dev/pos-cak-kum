import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/db/schema";

const STATUS_STYLES: Record<OrderStatus, string> = {
  awaiting_payment:
    "bg-cream-paper text-foreground border-border",
  pending_confirmation:
    "bg-cream-paper text-foreground border-border",
  processing:
    "bg-mint-wash text-foreground border-mint-glow",
  ready:
    "bg-mint-glow text-midnight-ink border-leaf-soft",
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
