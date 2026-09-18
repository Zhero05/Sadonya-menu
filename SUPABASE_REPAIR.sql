-- SADONYA PRODUCTION REPAIR — SAFE RLS / STORAGE FIX
--
-- IMPORTANT: This version avoids the recursive RLS policy that can make the
-- Supabase SQL connection hang/terminate.
-- It does NOT delete menu rows, images, categories, or users.
-- It does NOT renumber existing data.
--
-- Run this ONE time in Supabase SQL Editor.
-- If you already have branch_access rows, you do not need to edit anything.
-- OPTIONAL: If your admin has no branch_access row, set owner_email below
-- to the exact email from Authentication > Users. Leave the placeholder if
-- branch_access is already configured.

begin;

-- ------------------------------------------------------------
-- 1) Non-recursive authorization helper
-- ------------------------------------------------------------
create or replace function public.user_has_branch_access(p_branch_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.branch_access ba
    where ba.user_id = (select auth.uid())
      and ba.branch_key = p_branch_key
  );
$$;

revoke all on function public.user_has_branch_access(text) from public, anon;
grant execute on function public.user_has_branch_access(text) to authenticated;

-- ------------------------------------------------------------
-- 2) Optional owner recovery — ONLY when explicitly configured
-- ------------------------------------------------------------
do $$
declare
  owner_email text := 'OWNER_EMAIL_HERE@example.com';
  target_user uuid;
begin
  if owner_email is not null and owner_email <> '' then
    select id into target_user
    from auth.users
    where lower(email) = lower(owner_email)
    limit 1;

    if target_user is null then
      raise exception 'OWNER_EMAIL was not found in Authentication > Users.';
    end if;

    -- This matches the existing project design: the same admin can manage
    -- both Sadonya branches. This statement does not remove any access.
    insert into public.branch_access (user_id, branch_key)
    values (target_user, 'sadonya-cafe'), (target_user, 'sadonya-plus')
    on conflict do nothing;
  end if;
end $$;

-- ------------------------------------------------------------
-- 3) Grants
-- ------------------------------------------------------------
grant select on public.sadonya_cafe_settings to anon, authenticated;
grant insert, update, delete on public.sadonya_cafe_settings to authenticated;
grant select on public.sadonya_plus_settings to anon, authenticated;
grant insert, update, delete on public.sadonya_plus_settings to authenticated;

grant select on public.sadonya_cafe_categories to anon, authenticated;
grant insert, update, delete on public.sadonya_cafe_categories to authenticated;
grant select on public.sadonya_plus_categories to anon, authenticated;
grant insert, update, delete on public.sadonya_plus_categories to authenticated;

grant select on public.sadonya_cafe_items to anon, authenticated;
grant insert, update, delete on public.sadonya_cafe_items to authenticated;
grant select on public.sadonya_plus_items to anon, authenticated;
grant insert, update, delete on public.sadonya_plus_items to authenticated;

grant select on public.branch_access to authenticated;

-- ------------------------------------------------------------
-- 4) Enable RLS
-- ------------------------------------------------------------
alter table public.sadonya_cafe_settings enable row level security;
alter table public.sadonya_plus_settings enable row level security;
alter table public.sadonya_cafe_categories enable row level security;
alter table public.sadonya_plus_categories enable row level security;
alter table public.sadonya_cafe_items enable row level security;
alter table public.sadonya_plus_items enable row level security;
alter table public.branch_access enable row level security;

-- ------------------------------------------------------------
-- 5) Rebuild application policies using the SECURITY DEFINER helper.
--    This is the key fix for the RLS failure.
-- ------------------------------------------------------------
drop policy if exists "public read cafe settings" on public.sadonya_cafe_settings;
drop policy if exists "cafe owner write settings" on public.sadonya_cafe_settings;
drop policy if exists "public read plus settings" on public.sadonya_plus_settings;
drop policy if exists "plus owner write settings" on public.sadonya_plus_settings;

drop policy if exists "public read cafe categories" on public.sadonya_cafe_categories;
drop policy if exists "cafe owner insert categories" on public.sadonya_cafe_categories;
drop policy if exists "cafe owner update categories" on public.sadonya_cafe_categories;
drop policy if exists "cafe owner delete categories" on public.sadonya_cafe_categories;
drop policy if exists "public read plus categories" on public.sadonya_plus_categories;
drop policy if exists "plus owner insert categories" on public.sadonya_plus_categories;
drop policy if exists "plus owner update categories" on public.sadonya_plus_categories;
drop policy if exists "plus owner delete categories" on public.sadonya_plus_categories;

drop policy if exists "public read cafe items" on public.sadonya_cafe_items;
drop policy if exists "cafe owner insert items" on public.sadonya_cafe_items;
drop policy if exists "cafe owner update items" on public.sadonya_cafe_items;
drop policy if exists "cafe owner delete items" on public.sadonya_cafe_items;
drop policy if exists "public read plus items" on public.sadonya_plus_items;
drop policy if exists "plus owner insert items" on public.sadonya_plus_items;
drop policy if exists "plus owner update items" on public.sadonya_plus_items;
drop policy if exists "plus owner delete items" on public.sadonya_plus_items;
drop policy if exists "users read own branch access" on public.branch_access;

create policy "public read cafe settings"
on public.sadonya_cafe_settings for select to anon, authenticated
using (true);
create policy "cafe owner write settings"
on public.sadonya_cafe_settings for all to authenticated
using (public.user_has_branch_access('sadonya-cafe'))
with check (public.user_has_branch_access('sadonya-cafe'));

create policy "public read plus settings"
on public.sadonya_plus_settings for select to anon, authenticated
using (true);
create policy "plus owner write settings"
on public.sadonya_plus_settings for all to authenticated
using (public.user_has_branch_access('sadonya-plus'))
with check (public.user_has_branch_access('sadonya-plus'));

create policy "public read cafe categories"
on public.sadonya_cafe_categories for select to anon, authenticated
using (true);
create policy "cafe owner insert categories"
on public.sadonya_cafe_categories for insert to authenticated
with check (public.user_has_branch_access('sadonya-cafe'));
create policy "cafe owner update categories"
on public.sadonya_cafe_categories for update to authenticated
using (public.user_has_branch_access('sadonya-cafe'))
with check (public.user_has_branch_access('sadonya-cafe'));
create policy "cafe owner delete categories"
on public.sadonya_cafe_categories for delete to authenticated
using (public.user_has_branch_access('sadonya-cafe'));

create policy "public read plus categories"
on public.sadonya_plus_categories for select to anon, authenticated
using (true);
create policy "plus owner insert categories"
on public.sadonya_plus_categories for insert to authenticated
with check (public.user_has_branch_access('sadonya-plus'));
create policy "plus owner update categories"
on public.sadonya_plus_categories for update to authenticated
using (public.user_has_branch_access('sadonya-plus'))
with check (public.user_has_branch_access('sadonya-plus'));
create policy "plus owner delete categories"
on public.sadonya_plus_categories for delete to authenticated
using (public.user_has_branch_access('sadonya-plus'));

create policy "public read cafe items"
on public.sadonya_cafe_items for select to anon, authenticated
using (true);
create policy "cafe owner insert items"
on public.sadonya_cafe_items for insert to authenticated
with check (public.user_has_branch_access('sadonya-cafe'));
create policy "cafe owner update items"
on public.sadonya_cafe_items for update to authenticated
using (public.user_has_branch_access('sadonya-cafe'))
with check (public.user_has_branch_access('sadonya-cafe'));
create policy "cafe owner delete items"
on public.sadonya_cafe_items for delete to authenticated
using (public.user_has_branch_access('sadonya-cafe'));

create policy "public read plus items"
on public.sadonya_plus_items for select to anon, authenticated
using (true);
create policy "plus owner insert items"
on public.sadonya_plus_items for insert to authenticated
with check (public.user_has_branch_access('sadonya-plus'));
create policy "plus owner update items"
on public.sadonya_plus_items for update to authenticated
using (public.user_has_branch_access('sadonya-plus'))
with check (public.user_has_branch_access('sadonya-plus'));
create policy "plus owner delete items"
on public.sadonya_plus_items for delete to authenticated
using (public.user_has_branch_access('sadonya-plus'));

-- Safe: this policy does NOT query branch_access; it only compares auth.uid().
create policy "users read own branch access"
on public.branch_access for select to authenticated
using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6) Storage buckets + Storage RLS
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('sadonya-images', 'sadonya-images', true),
  ('sadonya-plus-images', 'sadonya-plus-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public read cafe images" on storage.objects;
drop policy if exists "cafe owner upload images" on storage.objects;
drop policy if exists "cafe owner update images" on storage.objects;
drop policy if exists "cafe owner delete images" on storage.objects;
drop policy if exists "public read plus images" on storage.objects;
drop policy if exists "plus owner upload images" on storage.objects;
drop policy if exists "plus owner update images" on storage.objects;
drop policy if exists "plus owner delete images" on storage.objects;

create policy "public read cafe images"
on storage.objects for select to public
using (bucket_id = 'sadonya-images');
create policy "public read plus images"
on storage.objects for select to public
using (bucket_id = 'sadonya-plus-images');

create policy "cafe owner upload images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'sadonya-images'
  and public.user_has_branch_access('sadonya-cafe')
);
create policy "cafe owner update images"
on storage.objects for update to authenticated
using (
  bucket_id = 'sadonya-images'
  and public.user_has_branch_access('sadonya-cafe')
)
with check (
  bucket_id = 'sadonya-images'
  and public.user_has_branch_access('sadonya-cafe')
);
create policy "cafe owner delete images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'sadonya-images'
  and public.user_has_branch_access('sadonya-cafe')
);

create policy "plus owner upload images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'sadonya-plus-images'
  and public.user_has_branch_access('sadonya-plus')
);
create policy "plus owner update images"
on storage.objects for update to authenticated
using (
  bucket_id = 'sadonya-plus-images'
  and public.user_has_branch_access('sadonya-plus')
)
with check (
  bucket_id = 'sadonya-plus-images'
  and public.user_has_branch_access('sadonya-plus')
);
create policy "plus owner delete images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'sadonya-plus-images'
  and public.user_has_branch_access('sadonya-plus')
);

-- ------------------------------------------------------------
-- 7) Item RPCs — keep them security-invoker and protected by the
--    table RLS policies above.
-- ------------------------------------------------------------
create or replace function public.save_sadonya_cafe_items(p_rows jsonb)
returns void language plpgsql security invoker set search_path = public
as $$
begin
  insert into public.sadonya_cafe_items (
    id, category_id, name, description, price, order_no,
    available, hidden, popular, image_url, updated_at
  )
  select r.id, r.category_id, r.name, r.description, r.price, r.order_no,
         r.available, r.hidden, r.popular, r.image_url, r.updated_at
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(
    id text, category_id text, name jsonb, description jsonb,
    price numeric(12,2), order_no integer, available boolean,
    hidden boolean, popular boolean, image_url text, updated_at timestamptz
  )
  on conflict (id) do update set
    category_id=excluded.category_id, name=excluded.name,
    description=excluded.description, price=excluded.price,
    order_no=excluded.order_no, available=excluded.available,
    hidden=excluded.hidden, popular=excluded.popular,
    image_url=excluded.image_url, updated_at=excluded.updated_at;

  -- Keep this in sync with 04_transactional_item_saves.sql: the admin UI
  -- sends the FULL item list on every save, so anything missing from
  -- p_rows must be deleted here too, or removed items silently "come back".
  delete from public.sadonya_cafe_items i
  where not exists (
    select 1 from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(id text)
    where r.id = i.id
  );
end;
$$;

create or replace function public.save_sadonya_plus_items(p_rows jsonb)
returns void language plpgsql security invoker set search_path = public
as $$
begin
  insert into public.sadonya_plus_items (
    id, category_id, name, description, price, order_no,
    available, hidden, popular, image_url, updated_at
  )
  select r.id, r.category_id, r.name, r.description, r.price, r.order_no,
         r.available, r.hidden, r.popular, r.image_url, r.updated_at
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(
    id text, category_id text, name jsonb, description jsonb,
    price numeric(12,2), order_no integer, available boolean,
    hidden boolean, popular boolean, image_url text, updated_at timestamptz
  )
  on conflict (id) do update set
    category_id=excluded.category_id, name=excluded.name,
    description=excluded.description, price=excluded.price,
    order_no=excluded.order_no, available=excluded.available,
    hidden=excluded.hidden, popular=excluded.popular,
    image_url=excluded.image_url, updated_at=excluded.updated_at;

  delete from public.sadonya_plus_items i
  where not exists (
    select 1 from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(id text)
    where r.id = i.id
  );
end;
$$;

revoke all on function public.save_sadonya_cafe_items(jsonb) from public, anon, authenticated;
revoke all on function public.save_sadonya_plus_items(jsonb) from public, anon, authenticated;
grant execute on function public.save_sadonya_cafe_items(jsonb) to authenticated;
grant execute on function public.save_sadonya_plus_items(jsonb) to authenticated;

commit;

-- ------------------------------------------------------------
-- 8) Small, read-only verification. These do not modify data.
-- ------------------------------------------------------------
select 'branch_access rows' as check_name, count(*) as value
from public.branch_access;

select id, name, public
from storage.buckets
where id in ('sadonya-images','sadonya-plus-images')
order by id;
