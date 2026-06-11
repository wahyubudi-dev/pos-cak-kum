import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";

type CartSummaryProps = {
  totalAmount: number;
  totalQuantity: number;
  hasInactiveItem: boolean;
  /** When set, the checkout link forwards the table number through the URL. */
  tableNumber: string | null;
};

/**
 * Sticky bottom bar with the running total and the Checkout CTA.
 *
 * Disabled state covers two cases:
 *   - Empty cart: nothing to check out.
 *   - At least one inactive item: customer must clear or update first
 *     (PRD CART-05).
 */
export function CartSummary({
  totalAmount,
  totalQuantity,
  hasInactiveItem,
  tableNumber,
}: CartSummaryProps) {
  const isCheckoutDisabled = totalQuantity === 0 || hasInactiveItem;
  const checkoutHref = tableNumber
    ? `/checkout?table=${encodeURIComponent(tableNumber)}`
    : "/checkout";

  return (
    <div className="sticky bottom-4 z-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-4 shadow-subtle sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </span>
            <span className="font-display text-2xl font-semibold text-foreground tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          {isCheckoutDisabled ? (
            <Button
              type="button"
              size="cta"
              variant="primary"
              disabled
            >
              Checkout
            </Button>
          ) : (
            <Button asChild size="cta" variant="primary">
              <Link href={checkoutHref}>Checkout</Link>
            </Button>
          )}
        </div>
        {hasInactiveItem ? (
          <p className="mt-3 text-xs text-destructive">
            Hapus item yang tidak tersedia sebelum melanjutkan ke pembayaran.
          </p>
        ) : null}
      </div>
    </div>
  );
}
