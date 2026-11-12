alter table public.fabric_products add column if not exists image_url text;
alter table public.fabric_products add column if not exists colors text[] not null default '{}';
alter table public.fabric_products add column if not exists note text;
alter table public.fabric_products add column if not exists feel text;
alter table public.tailoring_requests add column if not exists fabric_slug text;
create index if not exists tailoring_requests_fabric_slug_idx on public.tailoring_requests(fabric_slug);
