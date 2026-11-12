create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.fabric_products(id) on delete cascade,
  meters numeric(12,2) not null check (meters > 0),
  color text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, color)
);

create index if not exists cart_items_cart_created_idx on public.cart_items(cart_id, created_at desc);
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

create policy "users can manage own carts" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own cart items" on public.cart_items
  for all using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create trigger carts_updated_at before update on public.carts for each row execute procedure public.set_updated_at();
create trigger cart_items_updated_at before update on public.cart_items for each row execute procedure public.set_updated_at();
