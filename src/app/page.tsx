import Link from "next/link";
import { UtensilsCrossed, Coffee, CakeSlice } from "lucide-react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: UtensilsCrossed, label: "Mie Yamin & Mie Ayam" },
  { icon: Coffee, label: "Minuman Segar" },
  { icon: CakeSlice, label: "Cemilan & Dimsum" },
] as const;

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-pearl px-6">
      {/* Decorative background blobs */}
      <div
        className="pointer-events-none absolute -right-48 -top-48 h-[28rem] w-[28rem] rounded-full opacity-25"
        style={{ background: "var(--color-mint-wash)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-48 h-[32rem] w-[32rem] rounded-full opacity-15"
        style={{ background: "var(--color-brand-teal)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center gap-10 text-center">
        {/* Tag */}
        <span className="inline-flex items-center gap-2 rounded-full border border-mist bg-white px-3.5 py-1 text-xs font-medium text-midnight-ink shadow-subtle sm:text-sm sm:px-4 sm:py-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"
            style={{ background: "var(--color-brand-teal)" }}
            aria-hidden="true"
          />
          Kedai Cak Kum
        </span>

        {/* Headline */}
        <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-midnight-ink sm:text-5xl md:text-6xl">
          Pesan langsung
          <span className="block" style={{ color: "var(--color-brand-teal)" }}>
            dari meja kamu
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500-x sm:text-base">
          Mie ayam, dimsum, dan menu favorit lainnya. Scan QR, pilih menu,
          bayar, dan tunggu pesanan diantar.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {FEATURES.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-white px-3 py-1 text-xs font-medium text-zinc-500-x shadow-subtle"
            >
              <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {item.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="cta" variant="primary">
            <Link href="/menu">Lihat Menu</Link>
          </Button>
          <Button asChild size="cta" variant="outline">
            <Link href="/login">Masuk</Link>
          </Button>
        </div>
      </div>

      {/* Bottom credit */}
      <p className="absolute bottom-8 text-xs text-fog-gray">
        {new Date().getFullYear()} · Kedai Cak Kum
      </p>
    </main>
  );
}
