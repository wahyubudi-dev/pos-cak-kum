import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-pearl px-6">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand-teal/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cream-paper blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-7 rounded-3xl border border-mist bg-white px-7 py-12 text-center shadow-subtle sm:px-8 sm:py-14">
        {/* 404 mark */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="font-display text-[96px] font-semibold leading-none tracking-[-0.05em] text-brand-teal sm:text-[120px]"
          >
            404
          </span>
          <div className="h-1 w-16 rounded-full bg-cream-paper" />
        </div>

        {/* message */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-midnight-ink sm:text-[26px]">
            Halaman tidak ditemukan
          </h1>
          <p className="text-[13px] leading-relaxed text-zinc-500">
            Halaman yang kamu cari mungkin sudah dipindah, dihapus, atau
            tidak pernah ada. Tenang, pesanan kamu tetap aman.
          </p>
        </div>

        {/* illustration */}
        <div className="flex items-center gap-2 rounded-2xl bg-cream-paper/70 px-5 py-3">
          <span className="text-2xl">☕</span>
          <span className="text-[11px] text-zinc-500">
            Seduh kopi sementara kamu balik ke menu
          </span>
        </div>

        {/* action */}
        <Button
          asChild
          size="cta"
          variant="primary"
          className="w-full text-xs shadow-subtle hover:-translate-y-0.5 active:translate-y-0"
        >
          <Link href="/menu">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Kembali ke menu
          </Link>
        </Button>
      </div>
    </main>
  );
}
