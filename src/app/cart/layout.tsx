import type { ReactNode } from "react";

import { requireAuth } from "@/lib/auth/session";

/**
 * Auth gate for /cart routes. Anonymous visitors are bounced to /login
 * with redirectTo=/cart so they come back here after signing in (PRD AUTH-06).
 */
export default async function CartLayout({ children }: { children: ReactNode }) {
  await requireAuth("/cart");
  return <>{children}</>;
}
