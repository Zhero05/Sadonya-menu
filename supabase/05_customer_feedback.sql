-- Additive migration for customer feedback. Safe to run on the existing project.
-- Customers may submit; only authenticated users with branch_access may read/delete their branch.
begin;
create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  branch_key text not null check (branch_key in ('sadonya-cafe','sadonya-plus')),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  name text check (name is null or char_length(name) <= 120),
  email text check (email is null or char_length(email) <= 254),
  created_at timestamptz not null default now()
);
create index if not exists customer_feedback_branch_created_idx
  on public.customer_feedback(branch_key, created_at desc);
alter table public.customer_feedback enable row level security;
revoke all on public.customer_feedback from anon, authenticated;
grant insert on public.customer_feedback to anon, authenticated;
grant select, delete on public.customer_feedback to authenticated;
drop policy if exists "public can submit feedback" on public.customer_feedback;
create policy "public can submit feedback" on public.customer_feedback
  for insert to anon, authenticated
  with check (branch_key in ('sadonya-cafe','sadonya-plus') and rating between 1 and 5 and char_length(btrim(message)) between 1 and 2000);
drop policy if exists "staff read own branch feedback" on public.customer_feedback;
create policy "staff read own branch feedback" on public.customer_feedback
  for select to authenticated
  using (exists (select 1 from public.branch_access ba where ba.user_id=auth.uid() and ba.branch_key=customer_feedback.branch_key));
drop policy if exists "staff delete own branch feedback" on public.customer_feedback;
create policy "staff delete own branch feedback" on public.customer_feedback
  for delete to authenticated
  using (exists (select 1 from public.branch_access ba where ba.user_id=auth.uid() and ba.branch_key=customer_feedback.branch_key));
commit;
