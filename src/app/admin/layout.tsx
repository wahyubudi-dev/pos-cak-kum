import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Admin-only layout guard.
 *
 * Wraps every /admin/* route. Server-side check runs on each request, so a
 * customer who manually types /admin/orders gets bounced before any admin
 * markup is even sent down the wire. Pairs with the RLS policies in
 * 0002_rls.sql — defense in depth, never trust either layer alone.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-pearl">
      <AdminNav />
      {children}
    </div>
  );
}
