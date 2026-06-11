-- =============================================================================
-- Add is_featured flag to menus
-- =============================================================================
-- Curated by admin to surface menus in the "Rekomendasi" section on the
-- customer menu page. Defaults to false so existing rows are unaffected.
-- =============================================================================

alter table public.menus
  add column if not exists is_featured boolean not null default false;

create index if not exists menus_is_featured_idx on public.menus(is_featured);
