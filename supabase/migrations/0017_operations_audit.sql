drop policy if exists "staff can read waitlist" on public.waitlist_subscriptions;
create policy "staff can read waitlist" on public.waitlist_subscriptions
  for select using (public.current_user_role() in ('merchant', 'admin'));

drop policy if exists "staff can create audit logs" on public.audit_logs;
create policy "staff can create audit logs" on public.audit_logs
  for insert with check (public.current_user_role() in ('merchant', 'admin'));
