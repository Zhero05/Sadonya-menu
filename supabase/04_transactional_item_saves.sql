-- Sadonya migration: transactional menu item saves.
-- Run this once on an existing Supabase project. No table changes are required.
-- Safe to re-run.
-- One admin can manage both branches: RLS/branch_access remains the authorization boundary.
-- No separate admin account is required for either branch.

begin;

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
    id text, category_id text, name jsonb, description jsonb,
    price numeric(12,2), order_no integer, available boolean,
    hidden boolean, popular boolean, image_url text, updated_at timestamptz
  )
  on conflict (id) do update set
    category_id = excluded.category_id, name = excluded.name,
    description = excluded.description, price = excluded.price,
    order_no = excluded.order_no, available = excluded.available,
    hidden = excluded.hidden, popular = excluded.popular,
    image_url = excluded.image_url, updated_at = excluded.updated_at;

  delete from public.sadonya_cafe_items i
  where not exists (
    select 1 from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(id text)
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
    id text, category_id text, name jsonb, description jsonb,
    price numeric(12,2), order_no integer, available boolean,
    hidden boolean, popular boolean, image_url text, updated_at timestamptz
  )
  on conflict (id) do update set
    category_id = excluded.category_id, name = excluded.name,
    description = excluded.description, price = excluded.price,
    order_no = excluded.order_no, available = excluded.available,
    hidden = excluded.hidden, popular = excluded.popular,
    image_url = excluded.image_url, updated_at = excluded.updated_at;

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
