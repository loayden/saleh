alter function public.create_order_with_coupon(text, text, text, text, jsonb, text) security definer;
alter function public.create_order_with_coupon(text, text, text, text, jsonb, text) set search_path = public;
revoke all on function public.create_order_with_coupon(text, text, text, text, jsonb, text) from public;
grant execute on function public.create_order_with_coupon(text, text, text, text, jsonb, text) to authenticated;
