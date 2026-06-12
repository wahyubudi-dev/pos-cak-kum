import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-pearl">
      <AdminSidebar />
      <div className="mx-auto max-w-5xl px-6 pb-20 min-[1440px]:pb-0">{children}</div>
    </div>
  );
}
