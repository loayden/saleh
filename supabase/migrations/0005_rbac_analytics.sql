create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_created_idx on public.analytics_events(event_name, created_at desc);
create index if not exists analytics_events_user_created_idx on public.analytics_events(user_id, created_at desc);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to anon, authenticated;

alter table public.analytics_events enable row level security;
alter table public.tailoring_requests enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.payments enable row level security;
alter table public.deliveries enable row level security;

create policy "users can create analytics events" on public.analytics_events
  for insert with check (user_id is null or user_id = auth.uid());
create policy "admins can read analytics events" on public.analytics_events
  for select using (public.current_user_role() = 'admin');

create policy "merchants and admins can manage products" on public.fabric_products
  for all using (public.current_user_role() in ('merchant', 'admin'))
  with check (public.current_user_role() in ('merchant', 'admin'));
create policy "merchants and admins can manage inventory" on public.inventory
  for all using (public.current_user_role() in ('merchant', 'admin'))
  with check (public.current_user_role() in ('merchant', 'admin'));
create policy "merchants and admins can read orders" on public.orders
  for select using (public.current_user_role() in ('merchant', 'admin') or auth.uid() = user_id);
create policy "merchants and admins can read order items" on public.order_items
  for select using (public.current_user_role() in ('merchant', 'admin') or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "merchants and admins can read inventory movements" on public.inventory_movements
  for select using (public.current_user_role() in ('merchant', 'admin'));
create policy "merchants and admins can read payments" on public.payments
  for select using (public.current_user_role() in ('merchant', 'admin') or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "merchants and admins can read deliveries" on public.deliveries
  for select using (public.current_user_role() in ('merchant', 'admin') or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "public can create tailoring requests" on public.tailoring_requests
  for insert with check (user_id is null or user_id = auth.uid());
create policy "users can read own tailoring requests" on public.tailoring_requests
  for select using (auth.uid() = user_id);
create policy "merchants and admins can manage tailoring requests" on public.tailoring_requests
  for all using (public.current_user_role() in ('merchant', 'admin'))
  with check (public.current_user_role() in ('merchant', 'admin'));

create policy "merchants and admins can manage tailors" on public.tailors
  for all using (public.current_user_role() in ('merchant', 'admin'))
  with check (public.current_user_role() in ('merchant', 'admin'));
create policy "admins can read profiles" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() = 'admin');
