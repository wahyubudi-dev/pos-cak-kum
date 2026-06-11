import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Server-side Supabase client.
 *
 * Use in Server Components, Server Actions, and Route Handlers.
 * Reads/writes cookies via the Next.js cookies() API.
 *
 * The set/remove handlers are wrapped in try/catch because Server Components
 * cannot mutate cookies — those calls only succeed in Server Actions and
 * Route Handlers. Mutations triggered from Server Components will be ignored,
 * which is the intended behavior per @supabase/ssr documentation.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Safe to ignore — the
            // proxy will refresh the session on the next request.
          }
        },
      },
    },
  );
}
