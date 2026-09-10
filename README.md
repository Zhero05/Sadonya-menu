# Sadonya Digital Menu

A production-structured static QR menu for Sadonya Cafe, deployed on Netlify and backed by Supabase.

## Structure

- `index.html` — branch/lobby page
- `menu.html` — Sadonya Cafe menu + staff portal
- `plus.html` — Sadonya Plus menu + staff portal
- `assets/css/` — page styles
- `assets/js/menu-app.js` — shared menu/admin application logic
- `assets/js/config-cafe.js` — Cafe environment configuration
- `assets/js/config-plus.js` — Plus environment configuration
- `assets/js/lobby.js` — lobby logic
- `supabase/` — database/security documentation
- `netlify.toml` — deployment and redirects

## Deployment

Publish the repository root on Netlify. The QR code should point to a stable custom domain such as `https://sadonya-cafe.netlify.app/menu` once configured.

## Security

The browser contains only the Supabase publishable key. That key is expected to be public. Database and Storage permissions must be enforced with Supabase Row Level Security (RLS) and Storage policies. Never place a `sb_secret_*` or legacy `service_role` key in this project.

Before production, verify that public users can read only the intended menu data and that only authenticated staff with the correct `branch_access` row can write their branch.

## New Supabase backend

See `supabase/SETUP.md` and run `supabase/01_schema.sql` in the NEW Supabase project. The old Supabase project is not modified by this package.
