import Link from "next/link";
import { Search } from "lucide-react";

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
            className="font-display text-base font-semibold leading-tight text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            Hallo, {greeting}
          </h1>
          {userName ? (
            <p className="text-[11px] text-muted-foreground leading-snug">
              Mau pesen apa nih!
              {/* Halo, {userName.split(" ")[0]} 👋, Mau pesen apa nih! */}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-snug">
              Mau pesen apa nih!
            </p>
          )}
        </div>

        {/* Right: search + table badge */}
        <div className="flex shrink-0 items-center gap-2">
          {tableNumber ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
                style={{ color: "var(--color-brand-teal)" }}
                aria-hidden="true"
              >
                <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v1A1.5 1.5 0 0 1 12.5 6H9v1h1.5a.75.75 0 0 1 0 1.5H9V14H7V8.5H5.5a.75.75 0 0 1 0-1.5H7V6H3.5A1.5 1.5 0 0 1 2 4.5v-1Z" />
              </svg>
              Meja {tableNumber}
            </span>
          ) : null}

          <Link
            href={`${returnPath}#menu-search`}
            aria-label="Cari menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-pearl hover:text-foreground"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
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
