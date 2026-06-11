import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Refresh the Supabase auth session for the incoming request.
 *
 * Called from the root proxy.ts (Next.js 16's renamed middleware). Rotates
 * the access token if it has expired, syncs cookies between the request and
 * the outgoing response, and returns the response that should be forwarded
 * to the user.
 *
 * Per @supabase/ssr docs, we MUST:
 *   1. Read cookies from the incoming request.
 *   2. Mirror every cookie write onto BOTH the request (for downstream
 *      handlers) and the response (for the browser).
 *   3. Call supabase.auth.getUser() — not getSession() — to actually trigger
 *      the refresh.
 *   4. Return the same response object we wrote cookies onto.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Triggers token refresh when needed.
  await supabase.auth.getUser();

  return response;
}
