-- Sadonya production backend schema
-- For a BRAND-NEW Supabase project.
-- This schema matches the current Sadonya production frontend:
--   /menu  -> sadonya-cafe
--   /plus  -> sadonya-plus
-- One Supabase Auth user can manage BOTH menus through branch_access.

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- 1. MENU SETTINGS
-- ============================================================
create table if not exists public.sadonya_cafe_settings (
  id text primary key,
  name text not null default 'Sadonya Cafe',
  description jsonb not null default '{}'::jsonb,
  logo_url text,
  phone text,
  instagram text,
  facebook text,
  snap text,
  location text,
  hours text,
  public_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sadonya_plus_settings (
  id text primary key,
  name text not null default 'Sadonya Plus',
  description jsonb not null default '{}'::jsonb,
  logo_url text,
  phone text,
  instagram text,
  facebook text,
  snap text,
  location text,
  hours text,
  public_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
create table if not exists public.sadonya_cafe_categories (
  id text primary key,
  name jsonb not null default '{}'::jsonb,
  order_no integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sadonya_plus_categories (
  id text primary key,
  name jsonb not null default '{}'::jsonb,
  order_no integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. MENU ITEMS
-- ============================================================
create table if not exists public.sadonya_cafe_items (
  id text primary key,
  category_id text references public.sadonya_cafe_categories(id) on delete set null,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  price numeric(12,2) not null default 0,
  order_no integer not null default 0,
  available boolean not null default true,
  hidden boolean not null default false,
  popular boolean not null default false,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sadonya_plus_items (
  id text primary key,
  category_id text references public.sadonya_plus_categories(id) on delete set null,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  price numeric(12,2) not null default 0,
  order_no integer not null default 0,
  available boolean not null default true,
  hidden boolean not null default false,
  popular boolean not null default false,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. ONE AUTH USER -> BOTH MENUS
-- ============================================================
create table if not exists public.branch_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_key text not null check (branch_key in ('sadonya-cafe', 'sadonya-plus')),
  created_at timestamptz not null default now(),
  primary key (user_id, branch_key)
);

create index if not exists branch_access_user_id_idx
  on public.branch_access(user_id);

create index if not exists cafe_items_category_idx
  on public.sadonya_cafe_items(category_id);

create index if not exists plus_items_category_idx
  on public.sadonya_plus_items(category_id);

-- ============================================================
-- 5. HELPER: updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cafe_settings_updated_at on public.sadonya_cafe_settings;
create trigger cafe_settings_updated_at
before update on public.sadonya_cafe_settings
for each row execute function public.set_updated_at();

drop trigger if exists plus_settings_updated_at on public.sadonya_plus_settings;
create trigger plus_settings_updated_at
before update on public.sadonya_plus_settings
for each row execute function public.set_updated_at();

drop trigger if exists cafe_categories_updated_at on public.sadonya_cafe_categories;
create trigger cafe_categories_updated_at
before update on public.sadonya_cafe_categories
for each row execute function public.set_updated_at();

drop trigger if exists plus_categories_updated_at on public.sadonya_plus_categories;
create trigger plus_categories_updated_at
before update on public.sadonya_plus_categories
for each row execute function public.set_updated_at();

drop trigger if exists cafe_items_updated_at on public.sadonya_cafe_items;
create trigger cafe_items_updated_at
before update on public.sadonya_cafe_items
for each row execute function public.set_updated_at();

drop trigger if exists plus_items_updated_at on public.sadonya_plus_items;
create trigger plus_items_updated_at
before update on public.sadonya_plus_items
for each row execute function public.set_updated_at();

-- ============================================================
-- 5B. TRANSACTIONAL MENU ITEM SAVE FUNCTIONS
-- These functions replace the browser's delete-all-then-insert flow.
-- Each save is atomic: if any row fails, PostgreSQL rolls back the
-- entire operation. SECURITY INVOKER keeps the existing RLS policies
-- as the authorization boundary.
-- ============================================================
create or replace function public.save_sadonya_cafe_items(p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.sadonya_cafe_items (
    id, category_id, name, description, price, order_no,
    available, hidden, popular, image_url, updated_at
  )
  select
    r.id, r.category_id, r.name, r.description, r.price, r.order_no,
    r.available, r.hidden, r.popular, r.image_url, r.updated_at
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(
    id text,
    category_id text,
    name jsonb,
    description jsonb,
    price numeric(12,2),
    order_no integer,
    available boolean,
    hidden boolean,
    popular boolean,
    image_url text,
    updated_at timestamptz
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    order_no = excluded.order_no,
    available = excluded.available,
    hidden = excluded.hidden,
    popular = excluded.popular,
    image_url = excluded.image_url,
    updated_at = excluded.updated_at;

  delete from public.sadonya_cafe_items i
  where not exists (
    select 1
    from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(id text)
    where r.id = i.id
  );
end;
$$;

create or replace function public.save_sadonya_plus_items(p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.sadonya_plus_items (
    id, category_id, name, description, price, order_no,
    available, hidden, popular, image_url, updated_at
  )
  select
    r.id, r.category_id, r.name, r.description, r.price, r.order_no,
    r.available, r.hidden, r.popular, r.image_url, r.updated_at
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(
    id text,
    category_id text,
    name jsonb,
    description jsonb,
    price numeric(12,2),
    order_no integer,
    available boolean,
    hidden boolean,
    popular boolean,
    image_url text,
    updated_at timestamptz
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    order_no = excluded.order_no,
    available = excluded.available,
    hidden = excluded.hidden,
    popular = excluded.popular,
    image_url = excluded.image_url,
    updated_at = excluded.updated_at;

  delete from public.sadonya_plus_items i
  where not exists (
    select 1
    from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(id text)
    where r.id = i.id
  );
end;
$$;

revoke all on function public.save_sadonya_cafe_items(jsonb) from public, anon, authenticated;
revoke all on function public.save_sadonya_plus_items(jsonb) from public, anon, authenticated;
grant execute on function public.save_sadonya_cafe_items(jsonb) to authenticated;
grant execute on function public.save_sadonya_plus_items(jsonb) to authenticated;

-- ============================================================
-- 6. RLS: ENABLE EVERY APP TABLE
-- ============================================================
alter table public.sadonya_cafe_settings enable row level security;
alter table public.sadonya_plus_settings enable row level security;
alter table public.sadonya_cafe_categories enable row level security;
alter table public.sadonya_plus_categories enable row level security;
alter table public.sadonya_cafe_items enable row level security;
alter table public.sadonya_plus_items enable row level security;
alter table public.branch_access enable row level security;

-- Remove any policies with the same names if this script is re-run.
drop policy if exists "public read cafe settings" on public.sadonya_cafe_settings;
drop policy if exists "cafe owner write settings" on public.sadonya_cafe_settings;
drop policy if exists "public read cafe categories" on public.sadonya_cafe_categories;
drop policy if exists "cafe owner insert categories" on public.sadonya_cafe_categories;
drop policy if exists "cafe owner update categories" on public.sadonya_cafe_categories;
drop policy if exists "cafe owner delete categories" on public.sadonya_cafe_categories;
drop policy if exists "public read cafe items" on public.sadonya_cafe_items;
drop policy if exists "cafe owner insert items" on public.sadonya_cafe_items;
drop policy if exists "cafe owner update items" on public.sadonya_cafe_items;
drop policy if exists "cafe owner delete items" on public.sadonya_cafe_items;

drop policy if exists "public read plus settings" on public.sadonya_plus_settings;
drop policy if exists "plus owner write settings" on public.sadonya_plus_settings;
drop policy if exists "public read plus categories" on public.sadonya_plus_categories;
drop policy if exists "plus owner insert categories" on public.sadonya_plus_categories;
drop policy if exists "plus owner update categories" on public.sadonya_plus_categories;
drop policy if exists "plus owner delete categories" on public.sadonya_plus_categories;
drop policy if exists "public read plus items" on public.sadonya_plus_items;
drop policy if exists "plus owner insert items" on public.sadonya_plus_items;
drop policy if exists "plus owner update items" on public.sadonya_plus_items;
drop policy if exists "plus owner delete items" on public.sadonya_plus_items;
drop policy if exists "users read own branch access" on public.branch_access;

-- ============================================================
-- 7. GRANTS
-- Public visitors: SELECT only.
-- Authenticated owners: SELECT/INSERT/UPDATE/DELETE on menu tables.
-- branch_access: SELECT own rows only; no browser writes.
-- ============================================================
revoke all on table public.sadonya_cafe_settings from anon, authenticated;
revoke all on table public.sadonya_plus_settings from anon, authenticated;
revoke all on table public.sadonya_cafe_categories from anon, authenticated;
revoke all on table public.sadonya_plus_categories from anon, authenticated;
revoke all on table public.sadonya_cafe_items from anon, authenticated;
revoke all on table public.sadonya_plus_items from anon, authenticated;
revoke all on table public.branch_access from anon, authenticated;

grant select on public.sadonya_cafe_settings to anon;
grant select, insert, update, delete on public.sadonya_cafe_settings to authenticated;

grant select on public.sadonya_plus_settings to anon;
grant select, insert, update, delete on public.sadonya_plus_settings to authenticated;

grant select on public.sadonya_cafe_categories to anon;
grant select, insert, update, delete on public.sadonya_cafe_categories to authenticated;

grant select on public.sadonya_plus_categories to anon;
grant select, insert, update, delete on public.sadonya_plus_categories to authenticated;

grant select on public.sadonya_cafe_items to anon;
grant select, insert, update, delete on public.sadonya_cafe_items to authenticated;

grant select on public.sadonya_plus_items to anon;
grant select, insert, update, delete on public.sadonya_plus_items to authenticated;

grant select on public.branch_access to authenticated;

-- ============================================================
-- 8. PUBLIC READ POLICIES
-- Menu content is intentionally public because customers scan QR codes.
-- ============================================================
create policy "public read cafe settings"
on public.sadonya_cafe_settings
for select to anon, authenticated
using (true);

create policy "public read cafe categories"
on public.sadonya_cafe_categories
for select to anon, authenticated
using (true);

create policy "public read cafe items"
on public.sadonya_cafe_items
for select to anon, authenticated
using (true);

create policy "public read plus settings"
on public.sadonya_plus_settings
for select to anon, authenticated
using (true);

create policy "public read plus categories"
on public.sadonya_plus_categories
for select to anon, authenticated
using (true);

create policy "public read plus items"
on public.sadonya_plus_items
for select to anon, authenticated
using (true);

-- ============================================================
-- 9. CAFE OWNER POLICIES
-- The SAME Auth user can have access to both menus by having
-- two rows in branch_access.
-- ============================================================
create policy "cafe owner write settings"
on public.sadonya_cafe_settings
for all to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
)
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner insert categories"
on public.sadonya_cafe_categories
for insert to authenticated
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner update categories"
on public.sadonya_cafe_categories
for update to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
)
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner delete categories"
on public.sadonya_cafe_categories
for delete to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner insert items"
on public.sadonya_cafe_items
for insert to authenticated
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner update items"
on public.sadonya_cafe_items
for update to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
)
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner delete items"
on public.sadonya_cafe_items
for delete to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

-- ============================================================
-- 10. PLUS OWNER POLICIES
-- ============================================================
create policy "plus owner write settings"
on public.sadonya_plus_settings
for all to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
)
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner insert categories"
on public.sadonya_plus_categories
for insert to authenticated
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner update categories"
on public.sadonya_plus_categories
for update to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
)
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner delete categories"
on public.sadonya_plus_categories
for delete to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner insert items"
on public.sadonya_plus_items
for insert to authenticated
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner update items"
on public.sadonya_plus_items
for update to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
)
with check (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner delete items"
on public.sadonya_plus_items
for delete to authenticated
using (
  exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

-- ============================================================
-- 11. BRANCH ACCESS POLICY
-- A logged-in user may see ONLY their own access rows.
-- They cannot grant themselves another branch from the browser.
-- ============================================================
create policy "users read own branch access"
on public.branch_access
for select to authenticated
using ((select auth.uid()) = user_id);

-- ============================================================
-- 12. STORAGE BUCKETS
-- Public read because menu images are public restaurant content.
-- Writes are restricted by Storage RLS policies below.
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('sadonya-images', 'sadonya-images', true),
  ('sadonya-plus-images', 'sadonya-plus-images', true)
on conflict (id) do update set public = excluded.public;

-- Remove policies if re-running this script.
drop policy if exists "public read cafe images" on storage.objects;
drop policy if exists "cafe owner upload images" on storage.objects;
drop policy if exists "cafe owner update images" on storage.objects;
drop policy if exists "cafe owner delete images" on storage.objects;
drop policy if exists "public read plus images" on storage.objects;
drop policy if exists "plus owner upload images" on storage.objects;
drop policy if exists "plus owner update images" on storage.objects;
drop policy if exists "plus owner delete images" on storage.objects;

-- Anyone can read objects from these public menu-image buckets.
create policy "public read cafe images"
on storage.objects
for select to public
using (bucket_id = 'sadonya-images');

create policy "public read plus images"
on storage.objects
for select to public
using (bucket_id = 'sadonya-plus-images');

-- Cafe owner can create/update/delete objects in the cafe bucket.
create policy "cafe owner upload images"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'sadonya-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner update images"
on storage.objects
for update to authenticated
using (
  bucket_id = 'sadonya-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
)
with check (
  bucket_id = 'sadonya-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

create policy "cafe owner delete images"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'sadonya-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-cafe'
  )
);

-- Plus owner can create/update/delete objects in the Plus bucket.
create policy "plus owner upload images"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'sadonya-plus-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner update images"
on storage.objects
for update to authenticated
using (
  bucket_id = 'sadonya-plus-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
)
with check (
  bucket_id = 'sadonya-plus-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

create policy "plus owner delete images"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'sadonya-plus-images'
  and exists (
    select 1 from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = 'sadonya-plus'
  )
);

-- ============================================================
-- 13. INITIAL MENU ROWS
-- Empty rows let the frontend immediately load/save settings.
-- Categories/items are intentionally left empty so your current
-- built-in demo data can display until the owner saves real data.
-- ============================================================
insert into public.sadonya_cafe_settings
  (id, name, description, public_url)
values
  ('sadonya-cafe', 'Sadonya Cafe',
   '{"en":"Coffee • Food • Desserts","ku":"قاوە • خواردن • شیرینی","ar":"قهوة • طعام • حلويات"}'::jsonb,
   'https://sadonya-cafe.netlify.app/menu')
on conflict (id) do nothing;

insert into public.sadonya_plus_settings
  (id, name, description, public_url)
values
  ('sadonya-plus', 'Sadonya Plus',
   '{"en":"Coffee • Food • Desserts","ku":"قاوە • خواردن • شیرینی","ar":"قهوة • طعام • حلويات"}'::jsonb,
   'https://sadonya-cafe.netlify.app/plus')
on conflict (id) do nothing;

commit;

-- ============================================================
-- 14. AFTER CREATING YOUR OWNER ACCOUNT
-- Run this separately after creating the Auth user.
-- Replace the email with the owner's real email.
-- ============================================================
-- insert into public.branch_access (user_id, branch_key)
-- select id, branch_key
-- from auth.users
-- cross join (values ('sadonya-cafe'), ('sadonya-plus')) as b(branch_key)
-- where email = 'OWNER_EMAIL_HERE@example.com'
-- on conflict do nothing;
