import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * OAuth callback handler.
 *
 * Supabase redirects here after Google authenticates the user. We exchange
 * the one-time code for a session, then forward the user to the page they
 * came from (or the menu by default).
 *
 * Per Supabase SSR docs, this MUST be a Route Handler — Server Components
 * cannot mutate cookies, but the OAuth exchange writes a session cookie.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/menu";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const row = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (row.length > 0 && row[0].role === "admin") {
      return NextResponse.redirect(new URL("/admin", url));
    }
  }

  return NextResponse.redirect(new URL(next, url));
}
