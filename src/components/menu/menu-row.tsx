import Image from "next/image";
import Link from "next/link";

import { FireStack } from "@/components/menu/fire-stack";
import { formatRupiah } from "@/lib/format";
import type { MenuWithPopularity } from "@/lib/menus/queries";

type MenuRowProps = {
  menu: MenuWithPopularity;
  tableNumber: string | null;
  /** Show fire stack badge for featured/recommended items */
  showFire?: boolean;
};

/**
 * Compact, cheerful menu row card.
 * Smaller image (72×72), playful rounded corners, soft pastel shadow.
 * Click → /menu/[id]?table=N
 */
export function MenuRow({ menu, tableNumber, showFire = false }: MenuRowProps) {
  const href = tableNumber
    ? `/menu/${menu.id}?table=${encodeURIComponent(tableNumber)}`
    : `/menu/${menu.id}`;

  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_8px_rgba(1,157,145,0.08)] ring-1 ring-black/3 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(1,157,145,0.13)] hover:ring-black/6 active:scale-[0.98]"
      aria-label={`${menu.name} — ${formatRupiah(Number(menu.price))}`}
    >
      {/* Fire stack — floating top right */}
      <FireStack isFeatured={showFire} />

      {/* Image — compact 72×72 with fun rounded-xl */}
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-(--color-cream-paper)">
        {menu.imageUrl ? (
          <Image
            src={menu.imageUrl}
            alt={menu.name}
            fill
            sizes="72px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-2xl" aria-hidden="true">
              🍽️
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
          {menu.name}
        </p>
        {menu.description ? (
          <p className="line-clamp-1 text-[10px] leading-relaxed text-muted-foreground">
            {menu.description}
          </p>
        ) : null}
        <p
          className="mt-0.5 text-[12px] font-extrabold"
          style={{ color: "var(--color-brand-teal)" }}
        >
          {formatRupiah(Number(menu.price))}
        </p>
      </div>
    </Link>
  );
}
