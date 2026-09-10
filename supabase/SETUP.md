# Sadonya — new Supabase project setup

This backend is designed for the current production frontend:
- `/menu` = `sadonya-cafe`
- `/plus` = `sadonya-plus`
- one Supabase Auth user can manage both menus
- customers are public read-only users
- authenticated owner gets write access only when `branch_access` grants the relevant menu

## Dashboard steps

1. Create a NEW Supabase project. Do not touch the old project.
2. Open **SQL Editor → New query**.
3. Paste the complete contents of `01_schema.sql` and click **Run**.
4. Go to **Authentication → Users → Add user** and create the owner's email/password account. If the dashboard offers **Auto Confirm User**, enable it for the owner account.
5. Open **SQL Editor → New query**. In `02_owner_access.sql`, replace `OWNER_EMAIL_HERE@example.com` with the exact owner email, paste the file, and click **Run**.
6. The result should show exactly two rows for that same email: `sadonya-cafe` and `sadonya-plus`.
7. Go to **Project Settings → API Keys** (or the project's **Connect** dialog) and copy the new project's **Project URL** and **Publishable key**.
8. Put those two values into `assets/js/config-cafe.js` and `assets/js/config-plus.js`. Both files must use the SAME new Supabase URL and SAME new publishable key. Only their menu-specific values differ.
9. Run `03_verify.sql` in SQL Editor. Every listed application table should show `rowsecurity = true`; both storage buckets should exist and be public.
10. Deploy the project to a new Netlify site first. Test `/menu` and `/plus` before changing the production QR codes.

## Important

- Never put an `sb_secret_...` or legacy `service_role` key into these files.
- The `sb_publishable_...` key is intended for browser applications; RLS is what protects the database.
- Do not delete the old Supabase project until the new site has been tested.
- The two menus intentionally share one Auth user. The `branch_access` table gives that user two separate permissions.

### Existing production project

If your Supabase project was already created from an earlier version of this repository, run `04_transactional_item_saves.sql` once in the Supabase SQL Editor. It adds only two RPC functions; it does **not** change or recreate any tables.
