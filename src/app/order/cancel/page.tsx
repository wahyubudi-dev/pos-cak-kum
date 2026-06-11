import Link from "next/link";

import { Button } from "@/components/ui/button";

type SearchParams = Promise<{ from?: string }>;

export const metadata = {
  title: "Pembayaran dibatalkan · Kedai Cak Kum",
};

export default async function OrderCancelPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from } = await searchParams;
  const cartHref = from && from.startsWith("/cart") ? from : "/cart";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <span className="font-display text-2xl text-muted-foreground">×</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Pembayaran dibatalkan
          </h1>
          <p className="text-sm text-muted-foreground">
            Tidak masalah, pesanan kamu masih ada di keranjang. Selesaikan
            pembayaran kapan saja kamu siap.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button
            asChild
            size="cta"
            variant="primary"
          >
            <Link href={cartHref}>Kembali ke keranjang</Link>
          </Button>
          <Button asChild variant="ghost" size="cta">
            <Link href="/menu">Lanjut belanja</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
