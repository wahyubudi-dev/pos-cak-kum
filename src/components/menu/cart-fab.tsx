import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { formatRupiah } from "@/lib/format";

type CartFabProps = {
  itemCount: number;
  totalAmount: number;
  href?: string;
};

/**
 * Floating bottom nav bar showing cart items count + total.
 * Frosted glass card with teal accent badge.
 * Shown only when cart has items. Links to /cart.
 */
export function CartFab({ itemCount, totalAmount, href = "/cart" }: CartFabProps) {
  if (itemCount === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-6">
      <div className="pointer-events-auto mx-auto max-w-lg">
        <Link
          href={href}
          className="group flex items-center justify-between gap-4 rounded-full border border-border bg-white/90 px-5 py-4 shadow-subtle backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          {/* Left: count badge + label */}
          <span className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold text-white"
              style={{ background: "var(--color-brand-teal)" }}
            >
              {itemCount > 99 ? "99+" : itemCount}
            </span>
            <span className="text-sm font-semibold text-foreground">Lihat keranjang</span>
          </span>

          {/* Right: total + chevron */}
          <span className="flex items-center gap-1">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatRupiah(totalAmount)}
            </span>
            <ChevronRight
              className="h-4 w-4 text-muted-foreground transition-opacity group-hover:text-foreground"
              aria-hidden="true"
            />
          </span>
        </Link>
      </div>
    </div>
  );
}
