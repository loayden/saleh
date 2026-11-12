alter type public.user_role add value if not exists 'tailor';

alter table public.tailors add column if not exists user_id uuid references public.profiles(id) on delete set null;
create unique index if not exists tailors_user_id_idx on public.tailors(user_id) where user_id is not null;

drop policy if exists "public can read active products" on public.fabric_products;
create policy "public can read verified active products" on public.fabric_products
  for select using (active = true and verified = true);

drop policy if exists "public can read available inventory" on public.inventory;
create policy "public can read verified available inventory" on public.inventory
  for select using (meters > 0 and exists (select 1 from public.fabric_products p where p.id = product_id and p.active = true and p.verified = true));

create policy "merchants and admins can update orders" on public.orders
  for update using (public.current_user_role() in ('merchant', 'admin'))
  with check (public.current_user_role() in ('merchant', 'admin'));
create policy "merchants and admins can update deliveries" on public.deliveries
  for update using (public.current_user_role() in ('merchant', 'admin'))
  with check (public.current_user_role() in ('merchant', 'admin'));

create policy "tailors can read assigned requests" on public.tailoring_requests
  for select using (exists (select 1 from public.tailors t where t.id = tailor_id and t.user_id = auth.uid()));
create policy "tailors can update assigned requests" on public.tailoring_requests
  for update using (exists (select 1 from public.tailors t where t.id = tailor_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tailors t where t.id = tailor_id and t.user_id = auth.uid()));

alter table public.inspirations enable row level security;
alter table public.ai_sessions enable row level security;
alter table public.audit_logs enable row level security;
create policy "users can manage own inspirations" on public.inspirations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own ai sessions" on public.ai_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admins can read audit logs" on public.audit_logs
  for select using (public.current_user_role() = 'admin');
