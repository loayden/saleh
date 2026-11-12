insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read product images" on storage.objects;
create policy "public can read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "merchants can upload product images" on storage.objects;
create policy "merchants can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.current_user_role()) in ('merchant', 'admin'));

drop policy if exists "merchants can update product images" on storage.objects;
create policy "merchants can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.current_user_role()) in ('merchant', 'admin'))
  with check (bucket_id = 'product-images' and (select public.current_user_role()) in ('merchant', 'admin'));

drop policy if exists "merchants can delete product images" on storage.objects;
create policy "merchants can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.current_user_role()) in ('merchant', 'admin'));
