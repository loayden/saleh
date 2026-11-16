-- Product discovery fields are merchant-managed; no storefront values are invented.
alter table public.fabric_products add column if not exists is_new_arrival boolean not null default false;
alter table public.fabric_products add column if not exists is_best_seller boolean not null default false;
alter table public.fabric_products add column if not exists offer_price_egp numeric(12,2) check (offer_price_egp is null or offer_price_egp >= 0);
alter table public.fabric_products add column if not exists offer_ends_at timestamptz;
alter table public.fabric_products add column if not exists material text;
alter table public.fabric_products add column if not exists weight_gsm numeric(8,2) check (weight_gsm is null or weight_gsm > 0);
alter table public.fabric_products add column if not exists care_instructions text;
alter table public.fabric_products add column if not exists delivery_note text;

create index if not exists fabric_products_discovery_idx
  on public.fabric_products(is_new_arrival, is_best_seller, active, verified);
