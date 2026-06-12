import Link from "next/link";
import { Clock, LogOut } from "lucide-react";

type GreetingHeaderProps = {
  tableNumber: string | null;
  returnPath: string;
  userName?: string | null;
};

/**
 * Sticky top header with time-based greeting, search button, and table badge.
 * Server component — time computed from server timezone (WIB).
 * Shows "Selamat Pagi", "Selamat Sore", or "Selamat Malam" based on time.
 */
export function GreetingHeader({
  tableNumber,
  returnPath,
  userName,
}: GreetingHeaderProps) {
  const greeting = getGreeting();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 pl-4 pr-4 sm:pr-0">
        {/* Left: greeting */}
        <div className="min-w-0 flex flex-col gap-0.5">
          <h1
            className="font-display text-sm font-semibold leading-tight text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            {userName
              ? `Halo ${userName.split(" ")[0]}, ${greeting}`
              : `Halo, ${greeting}`}
          </h1>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Mau pesen apa nih!
          </p>
        </div>

        {/* Right: history + logout */}
        <div className="flex shrink-0 items-center gap-2">

          <Link
            href={
              tableNumber
                ? `/order/history?table=${encodeURIComponent(tableNumber)}`
                : "/order/history"
            }
            aria-label="Riwayat pesanan"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-pearl hover:text-foreground"
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              aria-label="Keluar"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function getGreeting(): string {
  // Server-side: use WIB (UTC+7) — the primary timezone of the target users
  const now = new Date();
  const wibHour = (now.getUTCHours() + 7) % 24;

  if (wibHour >= 3 && wibHour < 11) return "Selamat Pagi 🌤️";
  if (wibHour >= 11 && wibHour < 15) return "Selamat Siang ☀️";
  if (wibHour >= 15 && wibHour < 19) return "Selamat Sore 🌅";
  return "Selamat Malam 🌙";
}
