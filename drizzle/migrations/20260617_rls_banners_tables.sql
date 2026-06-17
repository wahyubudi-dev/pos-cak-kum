-- =============================================================================
-- 20260617_rls_banners_tables.sql — Enable RLS on banners and tables
-- =============================================================================
-- These two tables were created after the original RLS migration and never
-- had row-level security enabled. Anyone with the anon key could modify them
-- through the Supabase REST API.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
alter table public.banners enable row level security;
alter table public.tables  enable row level security;

-- -----------------------------------------------------------------------------
-- banners
--   - Public read (active banners for carousel).
--   - Admin all access.
-- -----------------------------------------------------------------------------
create policy banners_select_public
  on public.banners for select
  to anon, authenticated
  using (is_active = true);

create policy banners_select_admin
  on public.banners for select
  to authenticated
  using (public.is_admin());

create policy banners_modify_admin
  on public.banners for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- tables
--   - Public read (active tables for selection).
--   - Admin all access.
-- -----------------------------------------------------------------------------
create policy tables_select_public
  on public.tables for select
  to anon, authenticated
  using (is_active = true);

create policy tables_select_admin
  on public.tables for select
  to authenticated
  using (public.is_admin());

create policy tables_modify_admin
  on public.tables for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
