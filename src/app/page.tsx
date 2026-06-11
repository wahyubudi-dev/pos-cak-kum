import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-pearl px-6 py-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <span className="rounded-full bg-cream-paper px-4 py-1.5 text-sm font-medium text-midnight-ink">
          Kedai Cak Kum
        </span>
        <h1 className="font-display text-5xl font-semibold tracking-tight text-midnight-ink sm:text-6xl">
          Pesan langsung dari meja kamu.
        </h1>
        <p className="max-w-md text-base text-zinc-500-x">
          Mie ayam, dimsum, dan menu favorit lainnya. Scan QR di meja, pilih
          menu, bayar, dan tunggu pesanan datang.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="cta" variant="primary">
            <Link href="/menu">Lihat Menu</Link>
          </Button>
          <Button asChild size="cta" variant="ghost">
            <Link href="/login">Masuk</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
