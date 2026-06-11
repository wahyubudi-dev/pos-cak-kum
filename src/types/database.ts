/**
 * Minimal Database stub for the @supabase/ssr / @supabase/supabase-js
 * generic parameter.
 *
 * Application data access goes through Drizzle (see /src/lib/db). The
 * Supabase client is now used only for:
 *   - auth (cookies + session refresh) — never types DB rows
 *   - storage (image uploads) — also untyped
 *   - realtime (admin orders dashboard) — payloads are untyped JSON
 *
 * So we keep this stub empty rather than maintaining a parallel mirror of
 * the Drizzle schema. If you ever need typed table access from supabase-js,
 * import the row types from @/lib/db/schema directly instead of reviving
 * this file.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
