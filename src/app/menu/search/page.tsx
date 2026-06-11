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
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href={backHref}
            aria-label="Kembali"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-pearl hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold text-foreground">
            Cari Menu
          </h1>
        </div>
      </header>

      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--color-cream-paper)" }}
        >
          <span className="text-3xl">🔍</span>
        </div>
        <p className="font-display text-lg font-semibold text-foreground">
          Fitur pencarian segera hadir
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Untuk saat ini, silakan browse menu dari daftar kategori.
        </p>
      </div>
    </main>
  );
}
