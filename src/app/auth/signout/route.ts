import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Sign out the current user and redirect home.
 *
 * POST-only on purpose: GET would allow CSRF-ish links/preloads to log users
 * out unexpectedly. Forms posting to this route get a 303 redirect back to
 * the landing page once the session cookie has been cleared.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
