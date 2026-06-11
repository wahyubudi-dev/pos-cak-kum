import Link from "next/link";
import { ShoppingBag } from "lucide-react";

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
 * Sticky bottom bar with the running total, item count, and the Checkout CTA.
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
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-white p-4 shadow-subtle sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Total · {totalQuantity} item
            </span>
            <span className="font-display text-[14px] font-semibold tabular-nums text-foreground sm:text-[14px]">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          {isCheckoutDisabled ? (
            <Button
              type="button"
              size="cta"
              variant="primary"
              disabled
              className="text-xs"
            >
              Lanjutkan Checkout
            </Button>
          ) : (
            <Button asChild size="cta" variant="primary" className="gap-2.5 px-5 shadow-subtle hover:-translate-y-0.5 active:translate-y-0">
              <Link href={checkoutHref} className="text-xs">
                Lanjutkan Checkout
              </Link>
            </Button>
          )}
        </div>
        {hasInactiveItem ? (
          <p className="mt-3 text-[11px] text-destructive">
            Hapus item yang tidak tersedia sebelum melanjutkan ke pembayaran.
          </p>
        ) : null}
      </div>
    </div>
  );
}
