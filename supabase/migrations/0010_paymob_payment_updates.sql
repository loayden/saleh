create policy "customers can update own pending payment provider"
  on public.payments for update
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()) and status = 'pending')
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()) and provider in ('cash_on_delivery', 'paymob'));
