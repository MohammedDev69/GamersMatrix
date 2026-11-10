# Supabase setup — Gamers Matrix

Gamers Matrix uses Supabase for:

- PostgreSQL (all commerce data through Prisma/NestJS)
- Supabase Auth (email/password, Google, Discord)
- JWT signing and session refresh

The browser never receives a database password or service-role key. It only
uses the Supabase publishable key for Auth. All carts, orders, keys, payments,
roles, and admin actions continue through the NestJS API.

## 1. Create the project

Create a Supabase project in the region closest to the API deployment. In
**Project Settings → API**, copy:

- Project URL
- Publishable key (`sb_publishable_...`; legacy anon keys also work)

Use asymmetric JWT signing keys (ES256/RS256). The API verifies access tokens
from the project's cached JWKS endpoint; legacy HS256 projects fall back to the
Supabase Auth `/user` endpoint.

## 2. Create a dedicated Prisma role

Run this once in Supabase SQL Editor, replacing the password:

```sql
create user "prisma" with password 'GENERATE_A_LONG_PASSWORD' bypassrls createdb;
grant "prisma" to "postgres";

grant usage, create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public
  grant all on tables to prisma;
alter default privileges for role postgres in schema public
  grant all on routines to prisma;
alter default privileges for role postgres in schema public
  grant all on sequences to prisma;
```

From **Connect**, copy both pooler URLs:

- Transaction pooler, port `6543` → `DATABASE_URL`
- Session pooler, port `5432` → `DIRECT_URL`

The runtime URL should include `pgbouncer=true` and an appropriate
`connection_limit`.

## 3. Environment variables

Copy the examples and replace all placeholders:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Required API values:

```dotenv
DATABASE_URL="postgresql://prisma.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://prisma.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"
SUPABASE_ADMIN_EMAILS="owner@example.com"
```

Required web values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"
```

Never put the database password or Supabase service-role key in a
`NEXT_PUBLIC_*` variable.

## 4. Create the Supabase database schema

The baseline migration is PostgreSQL-native and enables RLS on every commerce
table without public policies. The dedicated Prisma role bypasses RLS; anon and
authenticated PostgREST access remains blocked.

```bash
npm run db:generate
npm run db:deploy
```

For a new disposable project, optional demo data can be loaded explicitly:

```bash
SEED_ALLOW_RESET=true npm run db:seed
```

The seed is destructive and refuses to run without that confirmation.

## 5. Move the existing SQLite data

First apply the Supabase migration to an **empty** project and take a backup of
`apps/api/prisma/dev.db`. Then run:

```bash
MIGRATE_TO_SUPABASE=true \
SQLITE_SOURCE="apps/api/prisma/dev.db" \
DIRECT_URL="postgresql://...:5432/postgres" \
npm run db:migrate:supabase-data
```

PowerShell:

```powershell
$env:MIGRATE_TO_SUPABASE="true"
$env:SQLITE_SOURCE="apps/api/prisma/dev.db"
$env:DIRECT_URL="postgresql://...:5432/postgres"
npm run db:migrate:supabase-data
```

The migration runs in one transaction, preserves IDs and relations, clears
legacy password hashes, removes stock Unsplash URLs, and refuses a non-empty
target by default. Existing commerce users are linked by email to their
Supabase Auth identity on first login.

## 6. Configure Auth URLs

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (use the production origin in production)
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://YOUR_PRODUCTION_DOMAIN/**`

Email confirmation should redirect to the same allowed site origin.

## 7. Enable Google

1. Create a Web OAuth client in Google Auth Platform.
2. Authorized JavaScript origins: local and production site origins.
3. Authorized redirect URI: the callback shown by Supabase, normally:
   `https://PROJECT_REF.supabase.co/auth/v1/callback`
4. Enable Google under **Authentication → Providers** and enter the Client ID
   and Client Secret.

Required scopes are `openid`, email, and profile.

## 8. Enable Discord

1. Create an application in Discord Developer Portal.
2. Under OAuth2 add:
   `https://PROJECT_REF.supabase.co/auth/v1/callback`
3. Enable Discord under **Authentication → Providers** and enter its Client ID
   and Client Secret.

## 9. Admin access

Admin status is never trusted from browser JWT metadata. On first sign-in, a
new user receives `ADMIN` only if their normalized email exists in
`SUPABASE_ADMIN_EMAILS`. Existing database roles are preserved.

## 10. Verification

After configuration:

```bash
npm run build
npm run test -w @gamersmatrix/api
```

Test email/password, Google, and Discord sign-in, then verify `/auth/me`, cart,
wishlist, checkout, account orders, and the admin authorization boundary.
