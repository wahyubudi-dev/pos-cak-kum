"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  FolderTree,
  Grid3x3,
  Image,
  Users,
  LogOut,
  Grip,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Pesanan" },
  { href: "/admin/menus", icon: UtensilsCrossed, label: "Menu" },
  { href: "/admin/categories", icon: FolderTree, label: "Kategori" },
  { href: "/admin/tables", icon: Grid3x3, label: "Meja" },
  { href: "/admin/banners", icon: Image, label: "Banner" },
  { href: "/admin/users", icon: Users, label: "Pengguna" },
] as const;

type IconType = typeof NAV_LINKS[number]["icon"];

/* ─── Shared card button ────────────────────────────────────── */

function NavCard({
  href,
  icon: Icon,
  label,
  isActive,
  showTooltip,
}: {
  href: string;
  icon: IconType;
  label: string;
  isActive: boolean;
  showTooltip?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex w-[3.2rem] h-[3.2rem] items-center justify-center rounded-2xl border p-3 shadow transition-all",
        isActive
          ? "border-brand-teal/20 bg-brand-teal/10 text-brand-teal"
          : "border-gray-50 bg-white text-muted-foreground hover:bg-brand-teal/5 hover:text-brand-teal",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <span className="sr-only">{label}</span>
      {showTooltip ? (
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

function LogoutCard() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="group relative flex w-[3.2rem] h-[3.2rem] items-center justify-center rounded-2xl border border-gray-50 bg-white shadow transition-all text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-500"
      >
        <LogOut className="h-5 w-5" strokeWidth={1.5} />
        <span className="sr-only">Keluar</span>
      </button>
    </form>
  );
}

/* ─── Desktop: floating bottom nav (1024–1439px) ──────────── */

function DesktopBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-3 rounded-3xl border-[1.5px] border-white bg-gray-50/90 px-3.5 py-3 shadow-md shadow-black/[0.03] min-[1024px]:max-[1439px]:flex"
      style={{ paddingBottom: "calc(0.875rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {NAV_LINKS.map((link) => (
        <NavCard
          key={link.href}
          href={link.href}
          icon={link.icon}
          label={link.label}
          isActive={pathname === link.href}
        />
      ))}
      <div className="h-7 w-px shrink-0 bg-border/50" />
      <LogoutCard />
    </nav>
  );
}

/* ─── Desktop: floating left sidebar (1440px+) ────────────── */

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="fixed top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-2xl border-[1.5px] border-white/80 bg-gray-50/90 px-3.5 py-4 shadow-md shadow-black/[0.03] min-[1440px]:flex left-[max(16px,calc(50%-594px))]">
      {NAV_LINKS.map((link) => (
        <NavCard
          key={link.href}
          href={link.href}
          icon={link.icon}
          label={link.label}
          isActive={pathname === link.href}
          showTooltip
        />
      ))}
      <div className="h-px w-7 shrink-0 bg-border/50" />
      <LogoutCard />
    </aside>
  );
}

/* ─── Mobile/Tablet: bottom floating nav ────────────────────── */

const MAIN_LINKS = NAV_LINKS.slice(0, 6);

function NavDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative flex w-[3.2rem] h-[3.2rem] items-center justify-center rounded-2xl border border-gray-50 bg-white shadow transition-all text-muted-foreground hover:bg-brand-teal/5 hover:text-brand-teal"
      >
        <Grip className="h-5 w-5" strokeWidth={1.5} />
        <span className="sr-only">Menu</span>
      </button>
      {open ? (
        <div className="absolute bottom-full left-1/2 mb-3 w-44 -translate-x-1/2 rounded-xl border border-border bg-white p-1.5 shadow-lg">
          {MAIN_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-teal/10 text-brand-teal"
                    : "text-muted-foreground hover:bg-brand-teal/5 hover:text-brand-teal",
                )}
              >
                <link.icon className="h-4 w-4" strokeWidth={1.5} />
                {link.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center rounded-3xl border-[1.5px] border-white bg-gray-50/90 px-3.5 py-3.5 shadow-md shadow-black/[0.03] lg:hidden"
      style={{ paddingBottom: "calc(0.875rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center justify-center gap-2">
        <NavDropdown pathname={pathname} />
        <div className="h-7 w-px shrink-0 bg-border/50" />
        <NavCard
          href={NAV_LINKS[6].href}
          icon={NAV_LINKS[6].icon}
          label={NAV_LINKS[6].label}
          isActive={pathname === NAV_LINKS[6].href}
        />
        <LogoutCard />
      </div>
    </nav>
  );
}

/* ─── Root ──────────────────────────────────────────────────── */

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <DesktopBottomNav pathname={pathname} />
      <DesktopSidebar pathname={pathname} />
      <MobileBottomNav pathname={pathname} />
    </>
  );
}
