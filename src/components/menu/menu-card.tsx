import Image from "next/image";

import { AddToCartButton } from "@/components/menu/add-to-cart-button";
import { formatRupiah } from "@/lib/format";
import type { Menu } from "@/lib/db/schema";

type MenuCardProps = {
  menu: Menu;
  isAuthenticated: boolean;
  returnPath: string;
};

/**
 * Single menu tile — full-bleed image dominates, info below.
 * Card stays a Server Component; only AddToCartButton is client.
 */
export function MenuCard({ menu, isAuthenticated, returnPath }: MenuCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow hover:shadow-subtle">
      {/* Full-bleed image — 4:5 portrait ratio */}
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "4/5" }}>
        {menu.imageUrl ? (
          <Image
            src={menu.imageUrl}
            alt={menu.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: "var(--color-cream-paper)" }}>
            <span className="text-3xl" aria-hidden="true">🍽️</span>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tanpa gambar
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground sm:text-base">
          {menu.name}
        </h3>
        {menu.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {menu.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {formatRupiah(Number(menu.price))}
          </span>
          <AddToCartButton
            menuId={menu.id}
            menuName={menu.name}
            isAuthenticated={isAuthenticated}
            returnPath={returnPath}
          />
        </div>
      </div>
    </article>
  );
}
