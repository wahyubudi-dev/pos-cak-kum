import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Runs before every matched request. We use it to keep the Supabase auth
 * session fresh by rotating the access token whenever it has expired.
 *
 * Role-based redirects (admin vs customer) live in Server Components and
 * route handlers, not here — the proxy is intentionally thin so we never
 * block requests on slow database lookups.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /*
   * Match every request EXCEPT:
   * - _next/static (build output)
   * - _next/image (image optimizer)
   * - favicon.ico, robots.txt, sitemap.xml
   * - any path with a file extension (assets in /public)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
