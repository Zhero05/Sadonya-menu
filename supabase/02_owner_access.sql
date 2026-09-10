-- Run this AFTER you create the owner's Auth account.
-- Replace the email below with the exact email used in Authentication > Users.

insert into public.branch_access (user_id, branch_key)
select id, branch_key
from auth.users
cross join (values ('sadonya-cafe'), ('sadonya-plus')) as b(branch_key)
where email = 'OWNER_EMAIL_HERE@example.com'
on conflict do nothing;

-- Verify that the SAME user has both menus:
select
  u.email,
  ba.user_id,
  ba.branch_key
from public.branch_access ba
join auth.users u on u.id = ba.user_id
where u.email = 'OWNER_EMAIL_HERE@example.com'
order by ba.branch_key;
