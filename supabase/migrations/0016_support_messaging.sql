create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 160),
  order_id uuid references public.orders(id) on delete set null,
  tailoring_request_id uuid references public.tailoring_requests(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_conversations_customer_updated_idx
  on public.support_conversations(customer_id, updated_at desc);
create index if not exists support_messages_conversation_created_idx
  on public.support_messages(conversation_id, created_at asc);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "customers and staff can read conversations" on public.support_conversations;
create policy "customers and staff can read conversations" on public.support_conversations
  for select using (customer_id = auth.uid() or public.current_user_role() in ('merchant', 'admin', 'tailor'));

drop policy if exists "customers can create conversations" on public.support_conversations;
create policy "customers can create conversations" on public.support_conversations
  for insert with check (customer_id = auth.uid());

drop policy if exists "customers and staff can update conversations" on public.support_conversations;
create policy "customers and staff can update conversations" on public.support_conversations
  for update using (customer_id = auth.uid() or public.current_user_role() in ('merchant', 'admin', 'tailor'))
  with check (customer_id = auth.uid() or public.current_user_role() in ('merchant', 'admin', 'tailor'));

drop policy if exists "customers can delete own conversations" on public.support_conversations;
create policy "customers can delete own conversations" on public.support_conversations
  for delete using (customer_id = auth.uid());

drop policy if exists "participants can read messages" on public.support_messages;
create policy "participants can read messages" on public.support_messages
  for select using (exists (select 1 from public.support_conversations c where c.id = conversation_id and (c.customer_id = auth.uid() or public.current_user_role() in ('merchant', 'admin', 'tailor'))));

drop policy if exists "participants can create messages" on public.support_messages;
create policy "participants can create messages" on public.support_messages
  for insert with check (sender_id = auth.uid() and exists (select 1 from public.support_conversations c where c.id = conversation_id and (c.customer_id = auth.uid() or public.current_user_role() in ('merchant', 'admin', 'tailor'))));

drop policy if exists "participants can mark messages read" on public.support_messages;
create policy "participants can mark messages read" on public.support_messages
  for update using (exists (select 1 from public.support_conversations c where c.id = conversation_id and (c.customer_id = auth.uid() or public.current_user_role() in ('merchant', 'admin', 'tailor'))))
  with check (exists (select 1 from public.support_conversations c where c.id = conversation_id and (c.customer_id = auth.uid() or public.current_user_role() in ('merchant', 'admin', 'tailor'))));

create trigger support_conversations_updated_at
  before update on public.support_conversations
  for each row execute procedure public.set_updated_at();

create or replace function public.touch_support_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.support_conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists support_message_touches_conversation on public.support_messages;
create trigger support_message_touches_conversation
  after insert on public.support_messages
  for each row execute procedure public.touch_support_conversation();
