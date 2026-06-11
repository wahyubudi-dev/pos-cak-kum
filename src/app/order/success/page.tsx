import Link from "next/link";

import { Button } from "@/components/ui/button";

type SearchParams = Promise<{ number?: string }>;

export const metadata = {
  title: "Pesanan diterima · Kedai Cak Kum",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { number } = await searchParams;
  const formattedNumber = number
    ? `#${number.padStart(3, "0")}`
    : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-wash">
          <span className="font-display text-2xl">✓</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Pesanan diterima
          </h1>
          <p className="text-sm text-muted-foreground">
            Terima kasih sudah memesan di Cak Kum. Tim dapur akan
            memverifikasi pembayaran lalu mulai menyiapkan pesanan kamu.
          </p>
        </div>

        {formattedNumber ? (
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-cream-paper px-6 py-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Nomor pesanan
            </span>
            <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
              {formattedNumber}
            </span>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Tunjukkan halaman ini ke staf jika diminta. Kamu juga bisa pesan
          tambahan kapan pun.
        </p>

        <div className="flex w-full flex-col gap-2">
          <Button
            asChild
            size="cta"
            variant="primary"
          >
            <Link href="/menu">Pesan lagi</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
