-- Nُسج initial schema. Apply only after configuring a Supabase/PostgreSQL project.
create extension if not exists pgcrypto;
create type public.user_role as enum ('customer', 'merchant', 'admin');
create type public.order_status as enum ('new', 'confirmed', 'preparing', 'handed_to_carrier', 'in_transit', 'delivered', 'cancelled', 'returned');
create type public.payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded');
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, role public.user_role not null default 'customer', full_name text, phone text, created_at timestamptz not null default now());
create table public.addresses (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, city text not null check (city in ('القاهرة', 'الإسكندرية')), district text not null, address_line text not null, is_default boolean not null default false, created_at timestamptz not null default now());
create table public.fabric_products (id uuid primary key default gen_random_uuid(), slug text not null unique, name_ar text not null, fabric_type text not null, price_egp numeric(12,2) not null check (price_egp >= 0), width_cm integer check (width_cm > 0), verified boolean not null default false, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.inventory (product_id uuid primary key references public.fabric_products(id) on delete cascade, meters numeric(12,2) not null default 0 check (meters >= 0), updated_at timestamptz not null default now());
create table public.orders (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), city text not null check (city in ('القاهرة', 'الإسكندرية')), district text not null, address_line text not null, phone text not null, status public.order_status not null default 'new', subtotal_egp numeric(12,2) not null check (subtotal_egp >= 0), delivery_fee_egp numeric(12,2) not null default 0 check (delivery_fee_egp >= 0), created_at timestamptz not null default now());
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid not null references public.fabric_products(id), meters numeric(12,2) not null check (meters > 0), unit_price_egp numeric(12,2) not null check (unit_price_egp >= 0));
create table public.inventory_movements (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.fabric_products(id), order_id uuid references public.orders(id), delta_meters numeric(12,2) not null, reason text not null, created_at timestamptz not null default now());
create table public.payments (id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id) on delete cascade, provider text not null default 'cash_on_delivery', provider_reference text, status public.payment_status not null default 'pending', created_at timestamptz not null default now());
create table public.deliveries (id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id) on delete cascade, provider text, tracking_reference text, status public.order_status not null default 'new', created_at timestamptz not null default now());
create table public.wishlists (user_id uuid not null references public.profiles(id) on delete cascade, product_id uuid not null references public.fabric_products(id) on delete cascade, created_at timestamptz not null default now(), primary key (user_id, product_id));
create table public.inspirations (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, storage_path text not null, analysis jsonb, created_at timestamptz not null default now());
create table public.ai_sessions (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, input jsonb not null, output jsonb, model text, created_at timestamptz not null default now());
create table public.tailors (id uuid primary key default gen_random_uuid(), name_ar text not null, city text not null check (city in ('القاهرة', 'الإسكندرية')), district text, verified boolean not null default false, active boolean not null default true, created_at timestamptz not null default now());
create table public.tailoring_requests (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, tailor_id uuid references public.tailors(id), order_id uuid references public.orders(id), details text not null, status text not null default 'new', created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now());
create table public.reviews (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, product_id uuid not null references public.fabric_products(id) on delete cascade, rating integer not null check (rating between 1 and 5), body text, approved boolean not null default false, created_at timestamptz not null default now(), unique (user_id, product_id));
create table public.coupons (id uuid primary key default gen_random_uuid(), code text not null unique, percent_off numeric(5,2) check (percent_off > 0 and percent_off <= 100), amount_off_egp numeric(12,2) check (amount_off_egp >= 0), starts_at timestamptz, expires_at timestamptz, active boolean not null default true, check (percent_off is not null or amount_off_egp is not null));
create table public.saved_designs (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text, inspiration_id uuid references public.inspirations(id) on delete set null, product_id uuid references public.fabric_products(id) on delete set null, modifications jsonb, generated_image_path text, created_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text not null, entity_id uuid, metadata jsonb, created_at timestamptz not null default now());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', '')) on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger fabric_products_updated_at before update on public.fabric_products for each row execute procedure public.set_updated_at();
create trigger inventory_updated_at before update on public.inventory for each row execute procedure public.set_updated_at();
create index fabric_products_type_active_idx on public.fabric_products(fabric_type, active);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_status_idx on public.orders(status);
create index inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);
create index tailoring_requests_tailor_status_idx on public.tailoring_requests(tailor_id, status);
create index notifications_user_unread_idx on public.notifications(user_id, read_at);
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.fabric_products enable row level security;
alter table public.inventory enable row level security;
alter table public.tailors enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_designs enable row level security;
-- Complete RLS policies only after the project's authorization model is chosen.
create policy "users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users can manage own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own wishlist" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "users can read own order items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "users can manage own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "users can manage own saved designs" on public.saved_designs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public can read active products" on public.fabric_products for select using (active = true);
create policy "public can read available inventory" on public.inventory for select using (meters > 0);
create policy "public can read verified active tailors" on public.tailors for select using (active = true and verified = true);
create policy "public can read approved reviews" on public.reviews for select using (approved = true);
create policy "users can create own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "users can update own reviews" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can mark own notifications read" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
