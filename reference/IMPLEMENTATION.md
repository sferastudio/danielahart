# Phase 1 — Foundation: Step-by-Step Implementation

> Execution checklist for Phase 1. Each step references DESIGN.md sections — no code is duplicated here.

---

## Block 1: Project Scaffolding

### 1.1 Initialize Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

> Run from `/workspaces/danielahart/`. This creates the App Router project with `src/` directory structure.

### 1.2 Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

This creates `components.json` and `src/lib/utils.ts` (with `cn()` helper).

### 1.3 Install shadcn components

```bash
npx shadcn@latest add button input card badge table dialog select label separator dropdown-menu tabs sonner
```

> 13 components total. See DESIGN.md §6 for usage mapping.

### 1.4 Copy brand logo

```bash
cp "reference/UI Reference/Daniel-Ahart-logo_FULL COLOR.png" public/logo.png
```

---

## Block 2: Brand Theme

### 2.1 Edit `tailwind.config.ts`

Replace contents with the config from **DESIGN.md §4**.

Adds:
- `colors.navy` (800, 900)
- `colors.brand` (red, red-hover)
- `colors.sidebar` (DEFAULT, foreground, muted, accent, border — all HSL via CSS vars)
- `fontFamily.sans` → Inter
- `borderRadius` (lg, md, sm using `--radius`)
- `plugins` → `tailwindcss-animate`

### 2.2 Edit `src/app/globals.css`

Replace the CSS custom properties block with the theme from **DESIGN.md §3**.

Adds:
- `--background`, `--foreground` (gray-50 based)
- `--primary` / `--primary-foreground` (red-600)
- `--secondary` / `--secondary-foreground` (navy-900)
- `--muted` / `--muted-foreground` (gray-500)
- `--ring` (red-600), `--radius` (0.5rem)
- `--brand-navy-900`, `--brand-navy-800`
- `--sidebar-*` (background, foreground, muted, accent, border)

---

## Block 3: Shared Utilities

### 3.1 Verify `src/lib/utils.ts`

Already created by shadcn init. Confirm it exports `cn()` using `clsx` + `tailwind-merge`.

### 3.2 Create `src/lib/constants.ts`

Use exact code from **DESIGN.md §11 — Constants**.

Exports:
- `STYLES` — `sectionHeader`, `pageTitle`, `currencyDisplay`, `cardPadding`
- `CURRENCY_FORMATTER` — `Intl.NumberFormat` for USD
- `PERCENTAGE_FORMATTER` — `(v: number) => string`
- `REPORT_DEADLINE_DAY` — `5`

### 3.3 Create `src/lib/types.ts`

Use exact code from **DESIGN.md §11 — Types**.

Exports:
- Type aliases: `UserRole`, `ReportStatus`, `FeeType`
- Interfaces: `Office`, `Profile`, `FeeConfiguration`, `MonthlyReport`

---

## Block 4: Supabase Setup

### 4.1 Install Supabase client libraries

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 4.2 Install Supabase CLI

```bash
npm install -g supabase
```

If global install is restricted, use `npx supabase` for all CLI commands.

### 4.3 Initialize Supabase project

```bash
supabase init
```

Creates `supabase/` directory with `config.toml`.

### 4.4 Edit `supabase/config.toml`

Under `[auth]`, set:

```toml
enable_signup = false
```

Enable the custom JWT access token hook (reference: DESIGN.md §9):

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

### 4.5 Create migration: `supabase/migrations/00001_create_tables.sql`

Contains all SQL from **DESIGN.md §8 — Tables + Triggers**:

1. `offices` table
2. `profiles` table (FK → `auth.users`)
3. `fee_configurations` table + unique partial index `idx_active_fee`
4. `monthly_reports` table + unique constraint `(office_id, report_month)`
5. `audit_log` table
6. `email_log` table
7. `compute_report_fees()` function + trigger on `monthly_reports`
8. `handle_new_user()` function + trigger on `auth.users`
9. `update_updated_at()` function + triggers on `offices`, `profiles`, `monthly_reports`

### 4.6 Create migration: `supabase/migrations/00002_create_rls_policies.sql`

Contains SQL from **DESIGN.md §8 — RLS Policies**:

1. Helper functions: `auth.user_role()`, `auth.user_office_id()`
2. Enable RLS on all 6 tables
3. Policies per table (see DESIGN.md §8 policy summary table):
   - `offices`: sub_office SELECT own; admin SELECT all
   - `profiles`: sub_office SELECT/UPDATE own; admin full CRUD
   - `fee_configurations`: sub_office SELECT active; admin full CRUD
   - `monthly_reports`: sub_office SELECT/INSERT/UPDATE own drafts; admin full access
   - `audit_log`: admin SELECT only
   - `email_log`: no client access

### 4.7 Create migration: `supabase/migrations/00003_create_jwt_hook.sql`

Contains exact SQL from **DESIGN.md §8 — JWT Claims Hook**:

1. `custom_access_token_hook(event jsonb)` function
2. Grant `USAGE` on schema `public` to `supabase_auth_admin`
3. Grant `EXECUTE` to `supabase_auth_admin`
4. Revoke `EXECUTE` from `authenticated`, `anon`, `public`

### 4.8 Create migration: `supabase/migrations/00004_seed_data.sql`

Contains exact SQL from **DESIGN.md §8 — Seed Data**:

1. Insert fee configs: royalty 7% + advertising 2% (effective 2026-01-01)
2. Insert test office: "Kudat Office #204", office_number "204"

---

## Block 5: Supabase Client Libraries

### 5.1 Create `src/lib/supabase/client.ts`

Browser client using `createBrowserClient` from `@supabase/ssr`.

Code: **DESIGN.md §10 — Browser client**.

### 5.2 Create `src/lib/supabase/server.ts`

Server client for RSC and Server Actions using `createServerClient` from `@supabase/ssr` with cookie handling.

Code: **DESIGN.md §10 — Server client**.

### 5.3 Create `src/lib/supabase/admin.ts`

Service-role client using `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`. Bypasses RLS.

Code: **DESIGN.md §10 — Admin client**.

### 5.4 Create `src/lib/supabase/middleware.ts`

Session refresh helper returning `{ supabase, user, response }`.

Code: **DESIGN.md §10 — Middleware helper**.

---

## Block 6: Auth & Middleware

### 6.1 Create `src/middleware.ts`

Full auth guard with role-based routing. Logic from **DESIGN.md §9 — Middleware flow diagram**:

1. Skip `/api/webhooks/*` (Stripe signature verified internally)
2. Refresh Supabase session via `updateSession()` from `lib/supabase/middleware`
3. No session + protected route → redirect `/login`
4. Has session + public route (`/login`) → redirect to role-specific dashboard
5. `/admin/*` + role ≠ admin → redirect `/office/dashboard`
6. `/office/*` + role ≠ sub_office → redirect `/admin/dashboard`
7. `/` → redirect to role-specific dashboard

**Matcher config** — exclude: `_next/static`, `_next/image`, `favicon.ico`, image file extensions.

---

## Block 7: Layouts & Pages

### 7.1 Edit `src/app/layout.tsx`

Root layout:
- Import Inter from `next/font/google`
- Apply `font.className` to `<html>`
- Wrap `{children}` in `<body>`
- Import `globals.css`

### 7.2 Edit `src/app/page.tsx`

Simple redirect:
- Import `redirect` from `next/navigation`
- Redirect to `/login`

### 7.3 Create `src/app/(auth)/layout.tsx`

Auth layout (DESIGN.md §7 — Auth Layout):
- Full-screen `bg-navy-900` (using `bg-secondary`)
- Centered white card (`max-w-md` or similar)
- `{children}` rendered inside card

### 7.4 Create `src/app/(auth)/login/page.tsx`

Client component (`"use client"`). See DESIGN.md §7 — Login Page:

1. Brand logo (`<Image src="/logo.png" />`)
2. "FRANCHISEE PORTAL" subtitle (section header style from `STYLES.sectionHeader`)
3. Email + Password inputs (shadcn `Input`)
4. "SIGN IN" red CTA button (full width, brand-red)
5. "Forgot your password?" link → `/forgot-password`
6. Error state display
7. Uses `supabase.auth.signInWithPassword()` from `lib/supabase/client`
8. On success: `router.push("/")` (middleware handles role routing)

### 7.5 Create `src/app/(auth)/forgot-password/page.tsx`

Placeholder page:
- Heading: "Forgot Password"
- Text: "Password reset coming soon."
- Link back to `/login`

### 7.6 Create `src/app/(auth)/reset-password/page.tsx`

Placeholder page:
- Heading: "Reset Password"
- Text: "Password reset coming soon."
- Link back to `/login`

### 7.7 Create `src/app/(dashboard)/layout.tsx`

Dashboard shell (DESIGN.md §7 — Dashboard Layout):
- Two-column: fixed sidebar + scrollable main content
- Main area: `bg-gray-50` (`bg-background`), `p-8`
- Sidebar (placeholder for now — full Sidebar component is Phase 2):
  - `bg-navy-900` (`bg-sidebar`)
  - Brand logo
  - Nav links (Dashboard, Past Reports, Account Settings)
  - User info card at bottom
  - "TERMINATE SESSION" logout button
- Server component: fetch user session, pass role/profile to sidebar
- `{children}` rendered in main content area

### 7.8 Create `src/app/(dashboard)/office/dashboard/page.tsx`

Placeholder:
- "Office Dashboard" heading
- "Revenue entry form coming in Phase 2."

### 7.9 Create `src/app/(dashboard)/admin/dashboard/page.tsx`

Placeholder:
- "Admin Dashboard" heading
- "Office management coming in Phase 4."

---

## Block 8: Environment & Startup

### 8.1 Start local Supabase

```bash
supabase start
```

Capture output — note the values for:
- `API URL` (typically `http://127.0.0.1:54321`)
- `anon key`
- `service_role key`
- `Studio URL` (typically `http://127.0.0.1:54323`)

### 8.2 Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
```

> This file is gitignored by default.

### 8.3 Run all migrations

```bash
supabase db reset
```

This applies all 4 migration files in order and resets the local database.

### 8.4 Create `scripts/seed-users.ts`

Script using `createAdminClient()` to call `supabase.auth.admin.createUser()`:

| Email | Password | Role | Office |
|-------|----------|------|--------|
| `admin@danielahart.com` | `admin123!` | `admin` | — (no `office_id`) |
| `kudat204@danielahart.com` | `office123!` | `sub_office` | Kudat Office #204 (look up office ID first) |

Each call includes `raw_user_meta_data: { role, full_name, office_id }` so the `handle_new_user` trigger creates the profile.

### 8.5 Run seed script

```bash
npx tsx scripts/seed-users.ts
```

---

## Block 9: Verification

Run `npm run dev` and verify all 12 items from **DESIGN.md §14**:

- [ ] `localhost:3000` redirects to `/login`
- [ ] Login as `admin@danielahart.com` → redirected to `/admin/dashboard`
- [ ] Login as `kudat204@danielahart.com` → redirected to `/office/dashboard`
- [ ] Admin visiting `/office/*` → redirected to `/admin/dashboard`
- [ ] Sub-office visiting `/admin/*` → redirected to `/office/dashboard`
- [ ] Unauthenticated user on any protected route → redirected to `/login`
- [ ] Login page visual check: navy background, white card, red CTA, Inter font
- [ ] Supabase Studio (`localhost:54323`): all 6 tables exist
- [ ] Supabase Studio: RLS policies enabled on all tables
- [ ] Supabase Studio: triggers exist (`compute_report_fees`, `handle_new_user`, `update_updated_at`)
- [ ] Supabase Studio: JWT claims hook registered
- [ ] Supabase Studio: seed data present (2 fee configs, 1 office)

---

## File Creation Order

For dependency correctness, create files in this order:

| Order | File | Depends On |
|-------|------|-----------|
| 1 | `tailwind.config.ts` | shadcn init |
| 2 | `src/app/globals.css` | shadcn init |
| 3 | `src/lib/constants.ts` | — |
| 4 | `src/lib/types.ts` | — |
| 5 | `src/lib/supabase/client.ts` | `@supabase/ssr` installed |
| 6 | `src/lib/supabase/server.ts` | `@supabase/ssr` installed |
| 7 | `src/lib/supabase/admin.ts` | `@supabase/supabase-js` installed |
| 8 | `src/lib/supabase/middleware.ts` | `@supabase/ssr` installed |
| 9 | `src/middleware.ts` | `src/lib/supabase/middleware.ts` |
| 10 | `src/app/layout.tsx` | `globals.css`, Inter font |
| 11 | `src/app/page.tsx` | — |
| 12 | `src/app/(auth)/layout.tsx` | `globals.css` theme |
| 13 | `src/app/(auth)/login/page.tsx` | `supabase/client.ts`, shadcn components |
| 14 | `src/app/(auth)/forgot-password/page.tsx` | — |
| 15 | `src/app/(auth)/reset-password/page.tsx` | — |
| 16 | `src/app/(dashboard)/layout.tsx` | `supabase/server.ts`, shadcn components |
| 17 | `src/app/(dashboard)/office/dashboard/page.tsx` | — |
| 18 | `src/app/(dashboard)/admin/dashboard/page.tsx` | — |
| 19 | `supabase/migrations/00001_create_tables.sql` | `supabase init` |
| 20 | `supabase/migrations/00002_create_rls_policies.sql` | migration 00001 |
| 21 | `supabase/migrations/00003_create_jwt_hook.sql` | migration 00001 |
| 22 | `supabase/migrations/00004_seed_data.sql` | migration 00001 |
| 23 | `.env.local` | `supabase start` output |
| 24 | `scripts/seed-users.ts` | `supabase/admin.ts`, `.env.local`, migrations applied |
| 25 | `public/logo.png` | source file in `reference/` |

---

## Quick Reference: DESIGN.md Section Map

| Block | DESIGN.md Section |
|-------|------------------|
| Brand theme (Tailwind) | §4 |
| Brand theme (CSS vars) | §3 |
| Design rules | §5 |
| Component inventory | §6 |
| Page layouts | §7 |
| Database schema | §8 |
| Auth & middleware | §9 |
| Supabase clients | §10 |
| Constants & types | §11 |
| File manifest | §12 |
| Implementation steps | §13 |
| Verification checklist | §14 |
