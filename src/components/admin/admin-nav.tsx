import Link from "next/link";

import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Pesanan" },
  { href: "/admin/menus", label: "Menu" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/tables", label: "Meja" },
  { href: "/admin/banners", label: "Banner" },
  { href: "/admin/users", label: "Pengguna" },
] as const;

/**
 * Top navigation bar shared across admin pages.
 *
 * Stays a Server Component because there's no per-link active state for now —
 * we keep navigation visually flat (LottieFiles-style hairline-only chrome)
 * and let URL changes communicate location instead.
 */
export function AdminNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-7">
          <Link href="/admin" className="flex shrink-0 items-center gap-2">
            <span className="font-display text-base font-semibold tracking-tight">
              Cak Kum
            </span>
            <span className="rounded-full bg-cream-paper px-2 py-0.5 text-xs font-medium text-foreground">
              Admin
            </span>
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-pearl"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <form action="/auth/signout" method="post">
          <Button type="submit" size="sm" variant="ghost" className="rounded-lg">
            Keluar
          </Button>
        </form>
      </div>
    </header>
  );
}
