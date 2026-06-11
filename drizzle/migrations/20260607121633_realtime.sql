-- =============================================================================
-- 0005_realtime.sql — Enable Realtime publication for admin dashboards
-- =============================================================================
-- Supabase Realtime broadcasts postgres changes only for tables explicitly
-- added to the supabase_realtime publication. Without this, the admin
-- orders dashboard subscription will connect successfully but never receive
-- any events.
--
-- We only enable orders for now — order_items are immutable post-create
-- (price snapshots), so subscribing to them adds noise without value.
-- =============================================================================

alter publication supabase_realtime add table public.orders;
