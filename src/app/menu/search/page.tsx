import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SearchParams = Promise<{ redirectTo?: string }>;

export const metadata = {
  title: "Cari Menu · Kedai Cak Kum",
};

/**
 * Placeholder search page. Will be implemented with full-text search later.
 */
export default async function MenuSearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirectTo } = await searchParams;
  const backHref = redirectTo?.trim() || "/menu";

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-5 sm:px-6">
          <Link
            href={backHref}
            aria-label="Kembali"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-subtle transition-colors hover:bg-pearl hover:text-foreground sm:h-11 sm:w-11"
          >
            <ArrowLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
          </Link>
          <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
            Cari Menu
          </h1>
          <div className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 sm:px-6">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--color-cream-paper)" }}
          >
            <span className="text-2xl">🔍</span>
          </div>
          <p className="font-display text-[15px] font-semibold text-foreground">
            Fitur pencarian segera hadir
          </p>
          <p className="max-w-xs text-[13px] text-muted-foreground leading-5">
            Untuk saat ini, silakan browse menu dari daftar kategori.
          </p>
        </div>
      </div>
    </main>
  );
}
