import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Initiate Google OAuth flow server-side.
 *
 * PKCE code verifier is stored in cookies by the server client, ensuring
 * the auth callback route handler can find it when exchanging the code.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawNext = url.searchParams.get("next");
  const next = rawNext?.startsWith("/") && !rawNext.includes("://")
    ? rawNext
    : "/menu";

  const supabase = await createClient();

  const callbackUrl = new URL("/auth/callback", url.origin);
  callbackUrl.searchParams.set("next", next);

  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (!data.url) {
    return NextResponse.redirect(new URL("/login?error=init_failed", url));
  }

  return NextResponse.redirect(data.url);
}
