import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MenuDetail } from "@/components/menu/menu-detail";
import { getMenuById } from "@/lib/menus/queries";
import { getCurrentUser } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ table?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const menu = await getMenuById(id);
  if (!menu) return { title: "Menu tidak ditemukan · Kedai Cak Kum" };
  return {
    title: `${menu.name} · Kedai Cak Kum`,
    description: menu.description ?? `Pesan ${menu.name} langsung dari meja kamu.`,
  };
}

/**
 * Menu detail page — server component shell.
 * Hero image → name/category/price/description → interactive client layer (MenuDetail).
 */
export default async function MenuDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ id }, { table }, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);

  const menu = await getMenuById(id);
  if (!menu) notFound();

  const tableNumber = table?.trim() || null;
  const backHref = tableNumber
    ? `/menu?table=${encodeURIComponent(tableNumber)}`
    : "/menu";
  const returnPath = tableNumber
    ? `/menu/${id}?table=${encodeURIComponent(tableNumber)}`
    : `/menu/${id}`;

  return (
    <main className="min-h-screen bg-background pb-44 sm:pb-80">
      {/* Sticky top header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-5 sm:px-6">
          <Link
            href={backHref}
            aria-label="Kembali ke menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-subtle transition-colors hover:bg-pearl hover:text-foreground sm:h-11 sm:w-11"
          >
            <ArrowLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
          </Link>

          <span className="truncate px-2 text-base font-semibold text-foreground sm:text-lg">
            {menu.name}
          </span>

          {tableNumber ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-subtle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
                style={{ color: "var(--color-brand-teal)" }}
                aria-hidden="true"
              >
                <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v1A1.5 1.5 0 0 1 12.5 6H9v1h1.5a.75.75 0 0 1 0 1.5H9V14H7V8.5H5.5a.75.75 0 0 1 0-1.5H7V6H3.5A1.5 1.5 0 0 1 2 4.5v-1Z" />
              </svg>
              Meja {tableNumber}
            </span>
          ) : (
            // Empty spacer to keep title centered
              <div className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden="true" />
            )}
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 sm:px-6">
        {/* Hero image */}
        <div className="pt-4 sm:pt-5">
          <div
            className="relative w-full overflow-hidden rounded-[28px] border border-border/60 bg-muted"
            style={{ aspectRatio: "1/1" }}
          >
            {menu.imageUrl ? (
              <Image
                src={menu.imageUrl}
                alt={menu.name}
                fill
                priority
                sizes="(min-width: 512px) 512px, 100vw"
                className="object-contain p-3 sm:p-4"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: "var(--color-cream-paper)" }}
              >
                  <span className="text-5xl sm:text-6xl" aria-hidden="true">
                    🍽️
                  </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 pt-5 pb-6 sm:gap-6 sm:pt-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {menu.category ? (
              <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-subtle">
                {menu.category.name}
              </span>
            ) : null}

            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium shadow-subtle"
              style={{
                background: menu.isActive
                  ? "color-mix(in srgb, var(--color-brand-teal) 10%, white)"
                  : "var(--color-cream-paper)",
                color: menu.isActive
                  ? "var(--color-brand-teal)"
                  : "var(--color-foreground)",
              }}
            >
              {menu.isActive ? "Tersedia" : "Tidak tersedia"}
            </span>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <h1
              className="font-display text-[18px] font-semibold text-foreground sm:text-[22px]"
              style={{ letterSpacing: "-0.03em", lineHeight: 1.2 }}
            >
              {menu.name}
            </h1>

          </div>

          {/* Description */}
          {menu.description ? (
            <p className="max-w-[34ch] text-[13px] leading-6 text-muted-foreground sm:text-[15px]">
              {menu.description}
            </p>
          ) : null}

          {/* Unavailable notice */}
          {!menu.isActive ? (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground"
              style={{ background: "var(--color-cream-paper)" }}
              role="alert"
            >
              Menu ini sedang tidak tersedia.
            </div>
          ) : null}

          {/* Interactive layer: notes + stepper + CTA */}
          <MenuDetail
            menuId={menu.id}
            menuName={menu.name}
            price={Number(menu.price)}
            isActive={menu.isActive}
            isAuthenticated={Boolean(user)}
            returnPath={returnPath}
          />
        </div>
      </div>
    </main>
  );
}
