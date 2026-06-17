import { Suspense } from "react";

import { GreetingHeader } from "@/components/menu/greeting-header";
import { HeroCarousel } from "@/components/menu/hero-carousel";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { CartFabAsync } from "@/components/menu/cart-fab-async";
import {
  getFeaturedMenus,
  getActiveMenusByCategoryWithPopularity,
} from "@/lib/menus/queries";
import { getActiveBanners } from "@/lib/banners/queries";
import { getCurrentUser } from "@/lib/auth/session";

type SearchParams = Promise<{ table?: string }>;

export const metadata = {
  title: "Menu · Kedai Cak Kum",
  description: "Pilih menu favorit dan pesan langsung dari meja kamu.",
};

/**
 * Customer-facing menu page (redesigned).
 * Layout: sticky greeting header → hero carousel → sticky category tabs
 *         → sections (Rekomendasi + per-category) → bottom nav bar (cart).
 */
export default async function MenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ table }, categories, featuredMenus, user, activeBanners] = await Promise.all([
    searchParams,
    getActiveMenusByCategoryWithPopularity(),
    getFeaturedMenus(8),
    getCurrentUser(),
    getActiveBanners(),
  ]);

  const tableNumber = table?.trim() || null;
  const returnPath = tableNumber
    ? `/menu?table=${encodeURIComponent(tableNumber)}`
    : "/menu";

  return (
    <main className="min-h-screen bg-white pb-36">
      {/* 1. Sticky greeting header */}
      <GreetingHeader
        tableNumber={tableNumber}
        returnPath={returnPath}
        userName={user?.fullName ?? null}
        isLoggedIn={!!user}
      />

      {/* 2. Hero banner carousel */}
      <div className="py-3.5">
        <HeroCarousel banners={activeBanners} />
      </div>

      {/* 3. Sticky category tabs + 4/5. Sections */}
      <div className="mx-auto max-w-lg">
        {categories.length === 0 && featuredMenus.length === 0 ? (
          <div className="pt-4">
            <EmptyState />
          </div>
        ) : (
          <MenuBrowser
            categories={categories}
            featuredMenus={featuredMenus}
            tableNumber={tableNumber}
          />
        )}
      </div>

      {/* 6. Bottom dark nav bar (streamed) */}
      <Suspense fallback={null}>
        <CartFabAsync tableNumber={tableNumber} />
      </Suspense>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="mx-4 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-7 py-20 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--color-cream-paper)" }}
        aria-hidden="true"
      >
        <span className="text-3xl" role="img" aria-label="menu kosong">
          🍜
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-display text-xl font-semibold text-foreground">
          Menu belum tersedia
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Tim Cak Kum sedang menyiapkan menu. Coba refresh halaman ini sebentar
          lagi.
        </p>
      </div>
    </div>
  );
}
