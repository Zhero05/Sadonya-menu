-- Run after setup. You should see RLS enabled on all 7 app tables.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'sadonya_cafe_settings',
    'sadonya_cafe_categories',
    'sadonya_cafe_items',
    'sadonya_plus_settings',
    'sadonya_plus_categories',
    'sadonya_plus_items',
    'branch_access'
  )
order by tablename;

-- See every RLS policy on the application tables.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname in ('public','storage')
  and (
    tablename in (
      'sadonya_cafe_settings',
      'sadonya_cafe_categories',
      'sadonya_cafe_items',
      'sadonya_plus_settings',
      'sadonya_plus_categories',
      'sadonya_plus_items',
      'branch_access'
    )
    or tablename = 'objects'
  )
order by schemaname, tablename, policyname;

-- Verify the two storage buckets exist and are public for menu images.
select id, name, public
from storage.buckets
where id in ('sadonya-images', 'sadonya-plus-images')
order by id;
