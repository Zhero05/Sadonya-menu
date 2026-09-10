# Supabase security checklist

This repository does not contain the Supabase service-role/secret key, and it should never contain one.

## Required controls

1. Enable Row Level Security on every public table used by the menu.
2. Public/anonymous users should have only the SELECT permissions needed to render the customer menu.
3. INSERT/UPDATE/DELETE should require an authenticated user and a matching `branch_access` record.
4. Storage upload/update/delete policies must enforce the same branch boundary.
5. Do not rely on JavaScript/admin-page hiding for authorization; the database must enforce it.
6. Review policies after every schema change.

## Suggested test cases

- Anonymous user can read the customer menu.
- Anonymous user cannot insert/update/delete menu rows.
- Authenticated staff for branch A cannot modify branch B.
- Authenticated staff without `branch_access` cannot modify any branch.
- Storage objects cannot be overwritten/deleted by anonymous users.
