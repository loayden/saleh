-- Customer experience foundations: measurements, waitlist, samples and traceable order status.
create table if not exists public.measurement_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  measurements jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists measurement_profiles_user_updated_idx
  on public.measurement_profiles(user_id, updated_at desc);

create table if not exists public.waitlist_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.fabric_products(id) on delete cascade,
  color text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, product_id, color)
);

create index if not exists waitlist_product_color_idx
  on public.waitlist_subscriptions(product_id, color);

create table if not exists public.sample_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.fabric_products(id) on delete cascade,
  color text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewing', 'sent', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, color)
);

create index if not exists sample_requests_product_created_idx
  on public.sample_requests(product_id, created_at desc);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_created_idx
  on public.order_status_events(order_id, created_at asc);

alter table public.measurement_profiles enable row level security;
alter table public.waitlist_subscriptions enable row level security;
alter table public.sample_requests enable row level security;
alter table public.order_status_events enable row level security;

drop policy if exists "users can manage own measurement profiles" on public.measurement_profiles;
create policy "users can manage own measurement profiles" on public.measurement_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can manage own waitlist" on public.waitlist_subscriptions;
create policy "users can manage own waitlist" on public.waitlist_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can manage own sample requests" on public.sample_requests;
create policy "users can manage own sample requests" on public.sample_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admins can manage sample requests" on public.sample_requests;
create policy "admins can manage sample requests" on public.sample_requests
  for all using (public.current_user_role() in ('merchant', 'admin'))
  with check (public.current_user_role() in ('merchant', 'admin'));

drop policy if exists "users can read own order status events" on public.order_status_events;
create policy "users can read own order status events" on public.order_status_events
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists "staff can read order status events" on public.order_status_events;
create policy "staff can read order status events" on public.order_status_events
  for select using (public.current_user_role() in ('merchant', 'admin'));

drop policy if exists "staff can create notifications" on public.notifications;
create policy "staff can create notifications" on public.notifications
  for insert with check (public.current_user_role() in ('merchant', 'admin'));

create trigger measurement_profiles_updated_at
  before update on public.measurement_profiles
  for each row execute procedure public.set_updated_at();
create trigger sample_requests_updated_at
  before update on public.sample_requests
  for each row execute procedure public.set_updated_at();

create or replace function public.record_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status, created_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_event on public.orders;
create trigger orders_status_event
  after insert or update of status on public.orders
  for each row execute procedure public.record_order_status_event();

-- Keep the existing transactional reservation RPC while recording its initial status
-- through the trigger above. This also preserves the color selected by the customer.
