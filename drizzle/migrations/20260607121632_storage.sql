-- =============================================================================
-- 0004_storage.sql — Storage bucket and policies for menu images
-- =============================================================================
-- Bucket: menu-images
--   - Public read so customers can see menu photos without auth.
--   - Admin-only write (insert / update / delete).
--
-- The bucket is created idempotently. Policies are defined on storage.objects
-- with the bucket_id filter — that's how Supabase Storage RLS works.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  2 * 1024 * 1024, -- 2 MB cap; matches PRD section 11.7
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Public read: anyone (anon or authenticated) can fetch menu images.
-- -----------------------------------------------------------------------------
create policy "menu_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

-- -----------------------------------------------------------------------------
-- Admin write: insert / update / delete are gated by public.is_admin().
-- -----------------------------------------------------------------------------
create policy "menu_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());

create policy "menu_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images' and public.is_admin())
  with check (bucket_id = 'menu-images' and public.is_admin());

create policy "menu_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());
