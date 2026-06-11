-- =============================================================================
-- 0003_triggers.sql — Triggers and automation
-- =============================================================================
-- Two responsibilities:
--   1. Mirror auth.users into public.users on signup.
--   2. Keep updated_at columns honest on every UPDATE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- handle_new_user(): seed public.users when a Supabase auth user appears.
--
-- Reads identity payload populated by the Google OAuth provider:
--   - raw_user_meta_data.full_name
--   - raw_user_meta_data.avatar_url
--
-- Falls back to email if full_name is missing. Role defaults to 'customer';
-- the very first admin must be promoted manually via the Supabase SQL editor.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- set_updated_at(): generic trigger to bump updated_at on UPDATE.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger menus_set_updated_at
  before update on public.menus
  for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
