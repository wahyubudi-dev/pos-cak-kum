import type { ReactNode } from "react";

import { requireAuth } from "@/lib/auth/session";

/**
 * Auth gate for /checkout. Anon users get bounced to /login with redirectTo.
 */
export default async function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth("/checkout");
  return <>{children}</>;
}
