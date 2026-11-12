alter table public.order_items add column if not exists color text;

create or replace function public.create_order_with_reservation(
  p_city text,
  p_district text,
  p_address_line text,
  p_phone text,
  p_lines jsonb
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_line jsonb;
  v_product public.fabric_products;
  v_meters numeric(12,2);
  v_color text;
  v_subtotal numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_city not in ('القاهرة', 'الإسكندرية') then raise exception 'CITY_NOT_SUPPORTED'; end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'LINES_REQUIRED'; end if;
  insert into public.orders (user_id, city, district, address_line, phone, subtotal_egp, delivery_fee_egp)
    values (v_user, p_city, p_district, p_address_line, p_phone, 0, v_delivery) returning id into v_order;
  for v_line in select * from jsonb_array_elements(p_lines) loop
    select fp.* into v_product from public.fabric_products fp join public.inventory i on i.product_id = fp.id where fp.id = (v_line->>'product_id')::uuid and fp.active = true and fp.verified = true for update;
    v_meters := (v_line->>'meters')::numeric;
    v_color := nullif(trim(v_line->>'color'), '');
    if v_meters is null or v_meters <= 0 then raise exception 'INVALID_QUANTITY'; end if;
    if not found then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;
    update public.inventory set meters = meters - v_meters, updated_at = now() where product_id = v_product.id and meters >= v_meters;
    if not found then raise exception 'INSUFFICIENT_STOCK'; end if;
    insert into public.order_items (order_id, product_id, meters, unit_price_egp, color) values (v_order, v_product.id, v_meters, v_product.price_egp, v_color);
    insert into public.inventory_movements (product_id, order_id, delta_meters, reason) values (v_product.id, v_order, -v_meters, 'order_reservation');
    v_subtotal := v_subtotal + (v_product.price_egp * v_meters);
  end loop;
  update public.orders set subtotal_egp = v_subtotal where id = v_order;
  insert into public.payments (order_id) values (v_order);
  insert into public.deliveries (order_id, status) values (v_order, 'new');
  return v_order;
end;
$$;
