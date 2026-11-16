alter table public.orders add column if not exists coupon_id uuid references public.coupons(id) on delete set null;
alter table public.orders add column if not exists discount_egp numeric(12,2) not null default 0 check (discount_egp >= 0);
create index if not exists orders_coupon_idx on public.orders(coupon_id);

alter table public.coupons enable row level security;
drop policy if exists "admins can manage coupons" on public.coupons;
create policy "admins can manage coupons" on public.coupons
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_coupon public.coupons;
  v_discount numeric(12,2);
begin
  if p_code is null or trim(p_code) = '' or p_subtotal is null or p_subtotal < 0 then
    return jsonb_build_object('valid', false, 'error', 'INVALID_COUPON');
  end if;
  select * into v_coupon from public.coupons
    where upper(code) = upper(trim(p_code)) and active
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
    for update;
  if not found then return jsonb_build_object('valid', false, 'error', 'INVALID_COUPON'); end if;
  v_discount := least(p_subtotal, coalesce(p_subtotal * v_coupon.percent_off / 100, v_coupon.amount_off_egp, 0));
  return jsonb_build_object('valid', true, 'couponId', v_coupon.id, 'code', v_coupon.code, 'discount', v_discount);
end;
$$;

revoke all on function public.validate_coupon(text, numeric) from public;
grant execute on function public.validate_coupon(text, numeric) to authenticated;

create or replace function public.create_order_with_coupon(
  p_city text,
  p_district text,
  p_address_line text,
  p_phone text,
  p_lines jsonb,
  p_coupon_code text default null
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_order uuid;
  v_coupon public.coupons;
  v_discount numeric(12,2) := 0;
begin
  v_order := public.create_order_with_reservation(p_city, p_district, p_address_line, p_phone, p_lines);
  if p_coupon_code is null or trim(p_coupon_code) = '' then return v_order; end if;
  select * into v_coupon from public.coupons
    where upper(code) = upper(trim(p_coupon_code)) and active
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
    for update;
  if not found then raise exception 'INVALID_COUPON'; end if;
  select least(o.subtotal_egp, coalesce(o.subtotal_egp * v_coupon.percent_off / 100, v_coupon.amount_off_egp, 0))
    into v_discount from public.orders o where o.id = v_order;
  update public.orders set coupon_id = v_coupon.id, discount_egp = v_discount, subtotal_egp = subtotal_egp - v_discount where id = v_order;
  return v_order;
end;
$$;
