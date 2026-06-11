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
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-16 sm:px-6">
      {/* subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-brand-teal/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-mint-wash/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-7 sm:py-12">
        {/* success icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal shadow-subtle sm:h-14 sm:w-14">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 sm:h-7 sm:w-7"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[22px] font-semibold tracking-tight sm:text-[26px]">
            Pesanan diterima
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Terima kasih sudah memesan di Cak Kum. Tim dapur akan
            memverifikasi pembayaran lalu mulai menyiapkan pesanan kamu.
          </p>
        </div>

        {formattedNumber ? (
          <div className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-cream-paper/50 px-5 py-4">
            <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
              Nomor pesanan
            </span>
            <span className="font-display text-[28px] font-bold tabular-nums text-foreground sm:text-[32px]">
              {formattedNumber}
            </span>
          </div>
        ) : null}

        {/* status timeline */}
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-teal/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 text-brand-teal"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-[12px] font-medium text-foreground">Pembayaran diverifikasi</span>
              <span className="text-[10px] text-muted-foreground">Staf akan cek pembayaran kamu</span>
            </div>
          </div>
          <div className="ml-2.5 h-4 w-0.5 rounded-full bg-border" />
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 text-muted-foreground"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-[12px] font-medium text-foreground">Pesanan dimasak</span>
              <span className="text-[10px] text-muted-foreground">Tim dapur mulai menyiapkan</span>
            </div>
          </div>
          <div className="ml-2.5 h-4 w-0.5 rounded-full bg-border" />
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 text-muted-foreground"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-[12px] font-medium text-foreground">Siap disajikan</span>
              <span className="text-[10px] text-muted-foreground">Pesanan diantar ke meja kamu</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Tunjukkan halaman ini ke staf jika diminta. Kamu juga bisa pesan
          tambahan kapan pun.
        </p>

        <Button asChild size="cta" variant="primary" className="w-full text-xs shadow-subtle hover:-translate-y-0.5 active:translate-y-0">
          <Link href="/menu">Pesan lagi</Link>
        </Button>
      </div>
    </main>
  );
}
