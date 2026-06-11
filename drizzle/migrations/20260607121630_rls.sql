-- =============================================================================
-- 0002_rls.sql — Row Level Security policies
-- =============================================================================
-- Tightens every table down to the minimum access each role needs.
--
-- Roles in play:
--   anon          — unauthenticated visitors (can browse public menu only)
--   authenticated — logged-in customers and admins (distinguished by users.role)
--
-- Pattern: an `is_admin()` helper reads public.users.role for the calling user
-- so policies stay short. The helper is SECURITY DEFINER to skip RLS on its
-- own SELECT — otherwise we would recurse into the very policy we're checking.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: is_admin()
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS on every table
-- -----------------------------------------------------------------------------
alter table public.users        enable row level security;
alter table public.categories   enable row level security;
alter table public.menus        enable row level security;
alter table public.carts        enable row level security;
alter table public.cart_items   enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;

-- -----------------------------------------------------------------------------
-- users
--   - User can read their own row (any authenticated user).
--   - Admin can read every row and update roles.
--   - Nobody inserts directly — the auth trigger in 0003 owns that.
-- -----------------------------------------------------------------------------
create policy users_select_self
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy users_select_admin
  on public.users for select
  to authenticated
  using (public.is_admin());

create policy users_update_admin
  on public.users for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- categories
--   - Public read (anon + authenticated).
--   - Admin-only writes.
-- -----------------------------------------------------------------------------
create policy categories_select_public
  on public.categories for select
  to anon, authenticated
  using (true);

create policy categories_modify_admin
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- menus
--   - Anyone can read ACTIVE menus.
--   - Admin can read all (including inactive) and modify.
-- -----------------------------------------------------------------------------
create policy menus_select_public
  on public.menus for select
  to anon, authenticated
  using (is_active = true);

create policy menus_select_admin
  on public.menus for select
  to authenticated
  using (public.is_admin());

create policy menus_modify_admin
  on public.menus for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- carts
--   - User can read and modify only their own cart.
-- -----------------------------------------------------------------------------
create policy carts_select_own
  on public.carts for select
  to authenticated
  using (user_id = auth.uid());

create policy carts_insert_own
  on public.carts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy carts_update_own
  on public.carts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy carts_delete_own
  on public.carts for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- cart_items
--   - User can manage items only in their own cart.
-- -----------------------------------------------------------------------------
create policy cart_items_select_own
  on public.cart_items for select
  to authenticated
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy cart_items_insert_own
  on public.cart_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy cart_items_update_own
  on public.cart_items for update
  to authenticated
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy cart_items_delete_own
  on public.cart_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- orders
--   - User can read and create their own orders.
--   - User cannot update / delete (status changes flow through admin).
--   - Admin sees and updates everything.
-- -----------------------------------------------------------------------------
create policy orders_select_own
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

create policy orders_insert_own
  on public.orders for insert
  to authenticated
  with check (user_id = auth.uid());

create policy orders_select_admin
  on public.orders for select
  to authenticated
  using (public.is_admin());

create policy orders_update_admin
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- order_items
--   - User can read items belonging to their own orders.
--   - User can insert items only for orders they just created.
--   - Admin sees all.
-- -----------------------------------------------------------------------------
create policy order_items_select_own
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy order_items_insert_own
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy order_items_select_admin
  on public.order_items for select
  to authenticated
  using (public.is_admin());
