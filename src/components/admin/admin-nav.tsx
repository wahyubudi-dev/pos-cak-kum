import Link from "next/link";

export function AdminNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
        <Link href="/admin" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-base font-semibold tracking-tight">
            Cak Kum
          </span>
          <span className="rounded-full bg-cream-paper px-2 py-0.5 text-xs font-medium text-foreground">
            Admin
          </span>
        </Link>
      </div>
    </header>
  );
}
