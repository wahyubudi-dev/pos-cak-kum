-- =============================================================================
-- 0001_init.sql — Schema: Kedai Cak Kum POS
-- =============================================================================
-- Creates the core tables backing the POS app:
--   users, categories, menus, carts, cart_items, orders, order_items
--
-- Enums and shared helpers live here too. RLS policies are kept in 0002_rls.sql
-- so this file stays focused on shape, not security.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');

create type public.order_status as enum (
  'pending_confirmation',
  'processing',
  'ready',
  'completed',
  'cancelled'
);

-- -----------------------------------------------------------------------------
-- users
-- Mirror of auth.users with app-specific fields. Populated by trigger in 0003.
-- -----------------------------------------------------------------------------
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index users_role_idx on public.users(role);

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index categories_sort_order_idx on public.categories(sort_order);

-- -----------------------------------------------------------------------------
-- menus
-- -----------------------------------------------------------------------------
create table public.menus (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete restrict,
  name         text not null,
  description  text,
  price        numeric(12, 2) not null check (price >= 0),
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index menus_category_idx on public.menus(category_id);
create index menus_is_active_idx on public.menus(is_active);

-- -----------------------------------------------------------------------------
-- carts (one per user)
-- -----------------------------------------------------------------------------
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- cart_items
-- -----------------------------------------------------------------------------
create table public.cart_items (
  id        uuid primary key default gen_random_uuid(),
  cart_id   uuid not null references public.carts(id) on delete cascade,
  menu_id   uuid not null references public.menus(id) on delete restrict,
  quantity  integer not null check (quantity > 0),
  notes     text check (notes is null or char_length(notes) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Same menu twice in a cart? Different notes = different lines, so we
  -- intentionally do NOT enforce a (cart_id, menu_id) unique constraint.
  unique (cart_id, menu_id, notes)
);

create index cart_items_cart_idx on public.cart_items(cart_id);

-- -----------------------------------------------------------------------------
-- orders
-- order_number is human-friendly (#001, #002, ...). Backed by a sequence so
-- gapless numbering is NOT guaranteed under contention — this is acceptable
-- for a single-outlet POS and matches the PRD requirement.
-- -----------------------------------------------------------------------------
create sequence public.order_number_seq start 1;

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       integer not null unique default nextval('public.order_number_seq'),
  user_id            uuid not null references public.users(id) on delete restrict,
  status             public.order_status not null default 'pending_confirmation',
  total_amount       numeric(12, 2) not null check (total_amount >= 0),
  table_number       text,
  payment_reference  text,
  payment_method     text,
  paid_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

-- -----------------------------------------------------------------------------
-- order_items
-- unit_price is a snapshot — we never re-price historical orders.
-- subtotal is GENERATED so it can never drift from quantity * unit_price.
-- -----------------------------------------------------------------------------
create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  menu_id     uuid not null references public.menus(id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(12, 2) not null check (unit_price >= 0),
  subtotal    numeric(12, 2) generated always as (quantity * unit_price) stored,
  notes       text check (notes is null or char_length(notes) <= 100),
  created_at  timestamptz not null default now()
);

create index order_items_order_idx on public.order_items(order_id);
