# Phase 1 — Foundation Design Specification

> Daniel Ahart Tax — Franchise Financial Reporting Portal

---

## 1. Project Overview

A web portal where franchise sub-offices submit monthly revenue reports and pay platform fees (royalty + advertising) via Stripe invoices. Admins manage offices, users, fee percentages, and generate aggregate reports. Automated emails remind offices of deadlines.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend/DB | Supabase (Postgres), Row-Level Security |
| Auth | Supabase Auth (email/password, no public signups) |
| Payments | Stripe (Card + ACH) — invoice-based |
| Email | Supabase Edge Functions + SMTP |
| Cron | Supabase pg_cron for monthly reminders |
| Deploy | Vercel |

### Environment

- Node 24, npm 11
- Docker available
- Supabase CLI (to be installed)

---

## 2. Brand Design Tokens

Derived from the UI reference screenshot (`reference/UI Reference/Screenshot 2026-03-09 at 1.39.23 PM.png`).

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `navy-900` | `#0A1E33` | Sidebar background |
| `navy-800` | `#0F2B46` | Calculated totals section |
| `red-600` | `#DC2626` | CTA buttons, deadline warning card |
| `red-700` | `#B91C1C` | CTA hover state |
| `gray-50` | `#F9FAFB` | Page background |
| `gray-500` | `#6B7280` | Secondary text, labels |

### Typography

- **Font family**: Inter (loaded via `next/font/google`) / system-ui / sans-serif fallback
- **Page title**: `text-2xl font-bold text-foreground` — e.g. "DASHBOARD"
- **Section headers**: `text-xs font-semibold uppercase tracking-widest text-muted-foreground` — e.g. "FRANCHISEE PORTAL", "CALCULATED TOTAL GROSS"
- **Body text**: `text-sm`
- **Large currency display**: `text-3xl font-bold` — e.g. "$0.00" in totals section

### Spacing

| Context | Value |
|---------|-------|
| Card padding | `p-6` |
| Page content area | `p-8` |
| Vertical section spacing | `space-y-4` / `space-y-6` |

---

## 3. CSS Custom Properties (shadcn Theme)

Map brand tokens to shadcn semantic variables in `src/app/globals.css`:

```css
@layer base {
  :root {
    --background: 210 20% 98%;        /* gray-50  #F9FAFB */
    --foreground: 210 40% 10%;

    --primary: 0 72% 51%;             /* red-600  #DC2626 */
    --primary-foreground: 0 0% 100%;

    --secondary: 210 55% 12%;         /* navy-900 #0A1E33 */
    --secondary-foreground: 0 0% 100%;

    --muted: 210 20% 96%;
    --muted-foreground: 215 14% 46%;  /* gray-500 #6B7280 */

    --accent: 210 20% 96%;
    --accent-foreground: 210 40% 10%;

    --ring: 0 72% 51%;                /* red-600  #DC2626 */
    --radius: 0.5rem;

    /* Brand custom properties */
    --brand-navy-900: 210 55% 12%;    /* #0A1E33 */
    --brand-navy-800: 207 56% 17%;    /* #0F2B46 */

    /* Sidebar custom properties */
    --sidebar-background: 210 55% 12%;
    --sidebar-foreground: 0 0% 100%;
    --sidebar-muted: 207 56% 17%;
    --sidebar-accent: 207 56% 22%;
    --sidebar-border: 207 56% 20%;
  }
}
```

---

## 4. Tailwind Config Extensions

`tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: "#0F2B46",
          900: "#0A1E33",
        },
        brand: {
          red: "#DC2626",
          "red-hover": "#B91C1C",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          muted: "hsl(var(--sidebar-muted))",
          accent: "hsl(var(--sidebar-accent))",
          border: "hsl(var(--sidebar-border))",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 5. Design Uniformity Rules

These 8 rules ensure every component matches the reference screenshot.

### Rule 1: CTA Buttons

```
bg-brand-red hover:bg-brand-red-hover text-white font-semibold uppercase tracking-wider
```

All primary actions (e.g. "CONFIRM & GENERATE STRIPE INVOICE", "SIGN IN") use this pattern. Include a right arrow icon (`>`) where shown in the reference.

### Rule 2: Section Headers

```
text-xs font-semibold uppercase tracking-widest text-muted-foreground
```

Applied via a shared constant `STYLES.sectionHeader`. Examples: "FRANCHISEE PORTAL", "MONTHLY REVENUE ENTRY", "CALCULATED TOTAL GROSS", "SUBMISSION STATUS".

### Rule 3: Currency Inputs

The `$` prefix is a styled `<span>` positioned outside/before the `<Input>` component, not inside it. All inputs use shadcn `Input` with `text-sm`.

### Rule 4: Cards

White background, `shadow-sm`, `rounded-lg` (from `--radius`), `p-6`. All content blocks are wrapped in shadcn `Card`.

### Rule 5: Dark Sections

`bg-navy-800` or `bg-navy-900` with `text-white`. Used for: sidebar, calculated totals area. Sub-items within dark sections use bordered containers with subtle lighter backgrounds.

### Rule 6: Number Formatting

**Always** use `CURRENCY_FORMATTER` and `PERCENTAGE_FORMATTER` from `constants.ts`. Never display raw floats. This prevents the floating-point display bug visible in the reference screenshot (e.g. `9.000000000000002%` and `7.000000000000001%`).

### Rule 7: Font Hierarchy

| Level | Class | Example |
|-------|-------|---------|
| Page title | `text-2xl font-bold` | "DASHBOARD" |
| Section header | `text-xs font-semibold uppercase tracking-widest` | "REPORTING PERIOD" |
| Body | `text-sm` | Input descriptions |
| Large currency | `text-3xl font-bold` | "$0.00" totals |

### Rule 8: Spacing

Cards use `p-6`. Page content area uses `p-8`. Vertical sections use `space-y-4` or `space-y-6`.

---

## 6. Component Inventory

### shadcn/ui Primitives (13 components)

Install all at once:

```bash
npx shadcn@latest add button input card badge table dialog select label separator dropdown-menu tabs sonner
```

| Component | Primary Usage |
|-----------|--------------|
| Button | CTA actions, sign in, terminate session |
| Input | Currency fields, email/password |
| Card | Content containers throughout |
| Badge | "5 DAYS REMAINING" countdown |
| Table | Past reports, admin office list |
| Dialog | Confirmations, user creation |
| Select | Month/year selectors, role assignment |
| Label | Form field labels |
| Separator | Visual dividers |
| Dropdown Menu | User menu, admin actions |
| Tabs | Admin report views |
| Toast (sonner) | Success/error notifications |

### Custom Components

| Category | Component | Purpose |
|----------|-----------|---------|
| Layout | `Sidebar` | Dark navy sidebar with logo, nav, user card |
| Layout | `SidebarNav` | Nav items with active left-border highlight |
| Layout | `PageHeader` | "FRANCHISEE PORTAL" subtitle + "DASHBOARD" title + period info |
| Dashboard | `MonthlyRevenueForm` | 4 currency inputs with labels and descriptions |
| Dashboard | `CalculatedTotals` | Dark section: total gross, platform fees, royalty/advertising breakdown |
| Dashboard | `SubmissionStatus` | Right sidebar card with green/yellow dot indicators per month |
| Dashboard | `DeadlineWarning` | Red warning card with exclamation icon and policy link |
| Admin | `OfficeStatusTable` | All offices + submission statuses |
| Admin | `ReportEditor` | Edit submitted report values |
| Admin | `FeeManager` | Update fee percentages |
| Admin | `UserManager` | CRUD users |
| Admin | `DateRangeReportForm` | Date range picker + CSV export |
| Reports | `ReportCard` | Single report summary card |
| Reports | `ReportTable` | Tabular report listing |

---

## 7. Page Layouts

### Auth Layout (`(auth)/layout.tsx`)

- Full-screen `bg-navy-900` background
- Centered white card (max-w ~`md`)
- Used by: `/login`, `/forgot-password`, `/reset-password`

### Login Page (`(auth)/login/page.tsx`)

- Brand logo at top of card
- "FRANCHISEE PORTAL" uppercase subtitle (section header style)
- Email input + Password input (shadcn Input)
- Red CTA "SIGN IN" button (full width)
- "Forgot your password?" link below
- Error state display (red text)
- Client component using `supabase.auth.signInWithPassword()`

### Dashboard Layout (`(dashboard)/layout.tsx`)

Two-column: fixed dark sidebar + scrollable main content area on `bg-gray-50`.

**Sidebar contents (top to bottom):**

1. Brand logo image
2. Green dot + "PLATFORM ONLINE" text
3. Nav items with left-border highlight on active:
   - Dashboard (grid icon)
   - Past Reports (document icon)
   - Account Settings (gear icon)
4. Bottom card:
   - "AUTHENTICATED AS" label (section header style)
   - Office name in bold (e.g. "KUDAT OFFICE #204")
   - "SWITCH TO ADMIN" red text link (visible to admin-capable users)
5. "TERMINATE SESSION" button with logout icon at very bottom

**Main content area:**

- `p-8` padding
- Page header at top with period info + countdown badge on right
- Content below varies by page

### Office Dashboard Page (`(dashboard)/office/dashboard/page.tsx`)

Reference: the UI screenshot. Three-column layout on large screens:

**Left column (main, ~2/3 width):**

1. `PageHeader`: "FRANCHISEE PORTAL" + "DASHBOARD" + "REPORTING PERIOD MARCH 2026" + "5 DAYS REMAINING" badge
2. `MonthlyRevenueForm` card:
   - Header: calendar icon + "MONTHLY REVENUE ENTRY" + "DUE MARCH 05, 2026" right-aligned
   - 2x2 grid of currency inputs:
     - Tax Preparation Fees — "Personal & Business Filings"
     - Bookkeeping Fees — "Monthly accounting services"
     - Insurance Commissions — "Adjusted gross commissions"
     - Other Service Fees — "Misc platform services"
3. `CalculatedTotals` dark section (`bg-navy-800`):
   - "CALCULATED TOTAL GROSS" + large `$0.00`
   - "PLATFORM FEES APPLIED" + formatted total percentage
   - Two bordered sub-boxes: "ROYALTY (7.00%)" + "$0.00" and "ADVERTISING (2.00%)" + "$0.00"
4. Red CTA button: "CONFIRM & GENERATE STRIPE INVOICE >"

**Right column (~1/3 width):**

1. `SubmissionStatus` card:
   - "SUBMISSION STATUS" header
   - Per-month rows with colored dot indicators:
     - Green dot = "Verified & Paid on MM/DD/YY"
     - Yellow/orange dot = "Drafting - Needs Submission"
2. `DeadlineWarning` card (red background):
   - Exclamation circle icon
   - "DEADLINE APPROACHING" bold white text
   - "Financial reports must be finalized by the 5th of each month to avoid platform suspension."
   - "VIEW POLICY HANDBOOK" outlined white button

---

## 8. Database Schema

### Tables

#### `offices`

```sql
CREATE TABLE offices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  office_number text NOT NULL UNIQUE,
  address       text,
  phone         text,
  email         text NOT NULL,
  stripe_customer_id text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

#### `profiles` (extends auth.users)

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id   uuid REFERENCES offices(id),
  role        text NOT NULL CHECK (role IN ('admin', 'sub_office')),
  full_name   text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

#### `fee_configurations`

```sql
CREATE TABLE fee_configurations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type       text NOT NULL CHECK (fee_type IN ('royalty', 'advertising')),
  percentage     numeric(5,4) NOT NULL,  -- e.g. 0.0700 = 7%
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to   date,                    -- NULL = currently active
  set_by         uuid REFERENCES profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Only one active rate per fee type
CREATE UNIQUE INDEX idx_active_fee
  ON fee_configurations (fee_type)
  WHERE effective_to IS NULL;
```

#### `monthly_reports`

```sql
CREATE TABLE monthly_reports (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id               uuid NOT NULL REFERENCES offices(id),
  report_month            date NOT NULL,  -- Always 1st of month, e.g. '2026-03-01'

  -- Revenue inputs
  tax_preparation_fees    numeric(12,2) NOT NULL DEFAULT 0,
  bookkeeping_fees        numeric(12,2) NOT NULL DEFAULT 0,
  insurance_commissions   numeric(12,2) NOT NULL DEFAULT 0,
  other_service_fees      numeric(12,2) NOT NULL DEFAULT 0,

  -- Computed by trigger
  total_gross             numeric(12,2) NOT NULL DEFAULT 0,

  -- Fee snapshots (captured at submission)
  royalty_percentage      numeric(5,4),
  advertising_percentage  numeric(5,4),

  -- Computed by trigger
  royalty_fee             numeric(12,2) NOT NULL DEFAULT 0,
  advertising_fee         numeric(12,2) NOT NULL DEFAULT 0,
  total_fees_due          numeric(12,2) NOT NULL DEFAULT 0,

  -- Status workflow
  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','submitted','invoiced','paid','overdue')),

  -- Metadata
  submitted_at            timestamptz,
  submitted_by            uuid REFERENCES profiles(id),
  edited_by               uuid REFERENCES profiles(id),
  edited_at               timestamptz,
  stripe_invoice_id       text,
  stripe_invoice_url      text,
  paid_at                 timestamptz,
  notes                   text,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  UNIQUE (office_id, report_month)
);
```

#### `audit_log`

```sql
CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  action      text NOT NULL,       -- e.g. 'report.submitted', 'fee.updated'
  entity_type text,
  entity_id   uuid,
  changes     jsonb,               -- { old: {...}, new: {...} }
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

#### `email_log`

```sql
CREATE TABLE email_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  template        text NOT NULL,   -- 'reminder_first', 'reminder_final', etc.
  subject         text NOT NULL,
  status          text NOT NULL CHECK (status IN ('sent', 'failed')),
  error           text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### Triggers

#### `compute_report_fees()` — BEFORE INSERT/UPDATE on `monthly_reports`

```sql
CREATE OR REPLACE FUNCTION compute_report_fees()
RETURNS TRIGGER AS $$
DECLARE
  v_royalty   numeric(5,4);
  v_advertising numeric(5,4);
BEGIN
  -- Sum revenue inputs
  NEW.total_gross := NEW.tax_preparation_fees
                   + NEW.bookkeeping_fees
                   + NEW.insurance_commissions
                   + NEW.other_service_fees;

  -- Snapshot active fee rates
  SELECT percentage INTO v_royalty
    FROM fee_configurations
    WHERE fee_type = 'royalty' AND effective_to IS NULL;

  SELECT percentage INTO v_advertising
    FROM fee_configurations
    WHERE fee_type = 'advertising' AND effective_to IS NULL;

  NEW.royalty_percentage    := COALESCE(v_royalty, 0);
  NEW.advertising_percentage := COALESCE(v_advertising, 0);

  -- Compute fees
  NEW.royalty_fee     := NEW.total_gross * NEW.royalty_percentage;
  NEW.advertising_fee := NEW.total_gross * NEW.advertising_percentage;
  NEW.total_fees_due  := NEW.royalty_fee + NEW.advertising_fee;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_report_fees
  BEFORE INSERT OR UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION compute_report_fees();
```

#### `handle_new_user()` — AFTER INSERT on `auth.users`

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, office_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sub_office'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'office_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### `update_updated_at()` — Generic timestamp trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### JWT Claims Hook

`supabase/migrations/00003_create_jwt_hook.sql`:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_office_id text;
BEGIN
  SELECT role, office_id::text
    INTO user_role, user_office_id
    FROM public.profiles
    WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'sub_office')));
  claims := jsonb_set(claims, '{office_id}', to_jsonb(COALESCE(user_office_id, '')));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

### RLS Policies

#### Helper functions

```sql
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'user_role',
    'sub_office'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.user_office_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'office_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;
```

#### Policy summary

| Table | Sub-office | Admin |
|-------|-----------|-------|
| `offices` | SELECT own office only | SELECT all |
| `profiles` | SELECT/UPDATE own only | Full CRUD |
| `fee_configurations` | SELECT active rates only | Full CRUD |
| `monthly_reports` | SELECT/INSERT/UPDATE own drafts | Full access |
| `audit_log` | No access | SELECT only (inserts via service-role) |
| `email_log` | No access | No client access (written by Edge Functions) |

### Seed Data

`supabase/migrations/00004_seed_data.sql`:

```sql
-- Active fee rates
INSERT INTO fee_configurations (fee_type, percentage, effective_from)
VALUES
  ('royalty',     0.0700, '2026-01-01'),
  ('advertising', 0.0200, '2026-01-01');

-- Test office
INSERT INTO offices (name, office_number, email)
VALUES ('Kudat Office #204', '204', 'kudat204@danielahart.com');
```

---

## 9. Authentication Flow & Middleware

### Flow

1. Admin creates user via `supabase.auth.admin.createUser()` with `raw_user_meta_data: { role, full_name, office_id }`
2. `handle_new_user()` trigger auto-creates `profiles` row
3. `custom_access_token_hook()` injects `user_role` and `office_id` into JWT claims
4. User signs in with email/password via `supabase.auth.signInWithPassword()`
5. Middleware reads JWT claims on every request — no DB query needed

### Middleware (`src/middleware.ts`)

```
Request
  │
  ├─ /api/webhooks/* ──────────────────────── PASS (Stripe signature verified internally)
  │
  ├─ Refresh Supabase session via @supabase/ssr
  │
  ├─ No session + non-public route ─────────── Redirect → /login
  │
  ├─ Has session + public route (/login) ───── Redirect → role dashboard
  │
  ├─ /admin/* + role != admin ──────────────── Redirect → /office/dashboard
  │
  ├─ /office/* + role != sub_office ────────── Redirect → /admin/dashboard
  │
  └─ / ─────────────────────────────────────── Redirect → role dashboard
```

**Matcher** excludes: `_next/static`, `_next/image`, `favicon.ico`, image files.

---

## 10. Supabase Client Utilities

### `src/lib/supabase/client.ts` — Browser client

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `src/lib/supabase/server.ts` — Server client (RSC / Server Actions)

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### `src/lib/supabase/admin.ts` — Service-role client (bypasses RLS)

```ts
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### `src/lib/supabase/middleware.ts` — Session refresh helper

```ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user, response };
}
```

---

## 11. Shared Constants & Types

### `src/lib/constants.ts`

```ts
export const STYLES = {
  sectionHeader: "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
  pageTitle: "text-2xl font-bold text-foreground",
  currencyDisplay: "text-3xl font-bold",
  cardPadding: "p-6",
} as const;

export const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const PERCENTAGE_FORMATTER = (v: number) => `${(v * 100).toFixed(2)}%`;

export const REPORT_DEADLINE_DAY = 5;
```

### `src/lib/types.ts`

```ts
export type UserRole = "admin" | "sub_office";
export type ReportStatus = "draft" | "submitted" | "invoiced" | "paid" | "overdue";
export type FeeType = "royalty" | "advertising";

export interface Office {
  id: string;
  name: string;
  office_number: string;
  address: string | null;
  phone: string | null;
  email: string;
  stripe_customer_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  office_id: string | null;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeConfiguration {
  id: string;
  fee_type: FeeType;
  percentage: number;
  effective_from: string;
  effective_to: string | null;
  set_by: string;
}

export interface MonthlyReport {
  id: string;
  office_id: string;
  report_month: string;
  tax_preparation_fees: number;
  bookkeeping_fees: number;
  insurance_commissions: number;
  other_service_fees: number;
  total_gross: number;
  royalty_percentage: number | null;
  advertising_percentage: number | null;
  royalty_fee: number;
  advertising_fee: number;
  total_fees_due: number;
  status: ReportStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  edited_by: string | null;
  edited_at: string | null;
  stripe_invoice_id: string | null;
  stripe_invoice_url: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 12. File Manifest (Phase 1)

27 files to create:

| # | File | Purpose |
|---|------|---------|
| 1 | `tailwind.config.ts` | Brand theme extension |
| 2 | `src/app/globals.css` | CSS custom properties mapped to brand tokens |
| 3 | `src/app/layout.tsx` | Root layout + Inter font |
| 4 | `src/app/page.tsx` | Root redirect to `/login` |
| 5 | `components.json` | shadcn config (created by `shadcn init`) |
| 6 | `src/components/ui/*.tsx` | 13 shadcn primitives (created by `shadcn add`) |
| 7 | `src/lib/utils.ts` | `cn()` utility (created by shadcn) |
| 8 | `src/lib/types.ts` | TypeScript interfaces |
| 9 | `src/lib/constants.ts` | Shared style constants + formatters |
| 10 | `src/lib/supabase/client.ts` | Browser Supabase client |
| 11 | `src/lib/supabase/server.ts` | Server Supabase client (RSC/Actions) |
| 12 | `src/lib/supabase/admin.ts` | Service-role client (bypasses RLS) |
| 13 | `src/lib/supabase/middleware.ts` | Session refresh helper |
| 14 | `src/middleware.ts` | Auth guard + role routing |
| 15 | `src/app/(auth)/layout.tsx` | Auth centered layout (navy bg, white card) |
| 16 | `src/app/(auth)/login/page.tsx` | Login page |
| 17 | `src/app/(auth)/forgot-password/page.tsx` | Forgot password placeholder |
| 18 | `src/app/(auth)/reset-password/page.tsx` | Reset password placeholder |
| 19 | `src/app/(dashboard)/layout.tsx` | Dashboard shell (sidebar + main) |
| 20 | `src/app/(dashboard)/office/dashboard/page.tsx` | Office dashboard placeholder |
| 21 | `src/app/(dashboard)/admin/dashboard/page.tsx` | Admin dashboard placeholder |
| 22 | `supabase/migrations/00001_create_tables.sql` | Tables + triggers |
| 23 | `supabase/migrations/00002_create_rls_policies.sql` | RLS policies + helper functions |
| 24 | `supabase/migrations/00003_create_jwt_hook.sql` | JWT claims hook |
| 25 | `supabase/migrations/00004_seed_data.sql` | Fee rates + test office |
| 26 | `public/logo.png` | Brand logo (copied from reference) |
| 27 | `.env.local` | Local Supabase credentials (gitignored) |
| 28 | `scripts/seed-users.ts` | User seeding script (admin + test sub_office) |

---

## 13. Implementation Steps

Execute in order:

```bash
# 1. Initialize Next.js project at repo root
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack

# 2. Initialize shadcn/ui (Style: Default, Base color: Slate, CSS variables: Yes)
npx shadcn@latest init

# 3. Install all 13 shadcn components
npx shadcn@latest add button input card badge table dialog select label separator dropdown-menu tabs sonner

# 4. Install Supabase CLI
npm install -g supabase

# 5. Initialize Supabase project
supabase init

# 6. Edit supabase/config.toml:
#    [auth]
#    enable_signup = false
#    ... enable custom JWT access token hook

# 7. Install Supabase client libraries
npm install @supabase/supabase-js @supabase/ssr

# 8. Start local Supabase
supabase start

# 9. Create .env.local with local Supabase credentials:
#    NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
#    SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>

# 10. Copy brand logo
cp "reference/UI Reference/Daniel-Ahart-logo_FULL COLOR.png" public/logo.png

# 11. Create all source files (see file manifest)

# 12. Run migrations
supabase db reset

# 13. Seed test users (run scripts/seed-users.ts)
npx tsx scripts/seed-users.ts

# 14. Start dev server
npm run dev
```

### Seed Users

| Email | Role | Office |
|-------|------|--------|
| `admin@danielahart.com` | admin | — |
| `kudat204@danielahart.com` | sub_office | Kudat Office #204 |

---

## 14. Verification Checklist

- [ ] `npm run dev` → localhost:3000 redirects to `/login`
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
