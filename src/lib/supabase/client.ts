import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client.
 *
 * Use in Client Components. Reads cookies via document.cookie automatically.
 * Do NOT import in Server Components, Route Handlers, or Server Actions —
 * use the server client there.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
