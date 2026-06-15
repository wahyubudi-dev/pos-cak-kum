import Link from "next/link";
import type { Metadata } from "next";
import { RefreshCw, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

type SearchParams = Promise<{ from?: string }>;

export const metadata: Metadata = {
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
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-14 sm:px-6">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-mint-wash/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-red-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-7 sm:py-12">
        {/* icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 shadow-sm">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-600"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6" />
            <path d="M9 9l6 6" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[22px] font-semibold tracking-tight sm:text-[26px]">
            Pembayaran dibatalkan
          </h1>
          <p className="text-[11px] text-muted-foreground px-2">
            Tidak masalah, kok. Kamu bisa coba lagi kapan pun. Keranjang
            belanja sudah dikosongkan — pesen lagi yuk!
          </p>
        </div>

        {/* info card */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-dashed border-border bg-cream-paper/50 px-5 py-4">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <RefreshCw className="h-4 w-4 text-amber-700" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-foreground">
                Waktu pembayaran habis
              </span>
              <span className="text-[10px] text-muted-foreground leading-relaxed">
                Invoice QRIS memiliki batas waktu. Kalau mau pesan lagi, cukup
                mulai ulang dari menu.
              </span>
            </div>
          </div>
        </div>

        {/* helpful tips */}
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-white px-5 py-3.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Tips
          </span>
          <ul className="flex flex-col gap-1.5 text-left">
            <li className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
              Pastikan koneksi internet stabil
            </li>
            <li className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
              Selesaikan pembayaran sebelum timer habis
            </li>
            <li className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
              Bisa juga pesan langsung ke staf di kasir
            </li>
          </ul>
        </div>

        <p className="text-[10px] text-muted-foreground">
          butuh bantuan? tanya staf Cak Kum langsung ya.
        </p>

        <div className="flex w-full flex-col gap-2">
          <Button
            asChild
            size="cta"
            variant="primary"
            className="w-full text-xs shadow-subtle hover:-translate-y-0.5 active:translate-y-0"
          >
            <Link href="/menu">
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
              Pesan lagi
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="cta"
            className="w-full text-xs"
          >
            <Link href="/menu">Lihat menu</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
