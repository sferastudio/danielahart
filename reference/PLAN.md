# Daniel Ahart Tax — Franchise Financial Reporting Platform

## Context

Daniel Ahart Tax needs a web portal where franchise sub-offices submit monthly revenue reports and pay platform fees (royalty + advertising) via Stripe invoices. Admins manage offices, users, fee percentages, and generate aggregate reports. Automated emails remind offices of deadlines. The UI follows a dark navy + red brand palette matching the provided screenshot reference.

---

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, **shadcn/ui** → deployed on Vercel
- **Backend/DB**: Supabase (Postgres), Row-Level Security
- **Auth**: Supabase Auth (email/password, no public signups)
- **Payments**: Stripe (Card + ACH) — invoice-based
- **Email**: Supabase Edge Functions + SMTP (e.g. Gmail, Mailgun, or any SMTP provider)
- **Cron**: Supabase pg_cron for monthly reminders

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                          # Login, forgot/reset password
│   │   ├── layout.tsx                   # Centered card layout, no sidebar
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/                     # Protected — shared sidebar layout
│   │   ├── layout.tsx                   # Sidebar + main content shell
│   │   ├── office/                      # Sub Office pages
│   │   │   ├── dashboard/page.tsx       # Monthly revenue entry form
│   │   │   ├── past-reports/page.tsx    # Read-only history
│   │   │   └── settings/page.tsx        # Password change
│   │   └── admin/                       # Admin pages
│   │       ├── dashboard/page.tsx       # All offices + statuses
│   │       ├── offices/[officeId]/page.tsx
│   │       ├── reports/page.tsx         # Date-range reports + CSV export
│   │       ├── users/page.tsx           # User management
│   │       ├── fees/page.tsx            # Fee % management + history
│   │       └── settings/page.tsx
│   └── api/webhooks/stripe/route.ts     # Stripe webhook handler
├── components/
│   ├── ui/                              # shadcn/ui components (Button, Input, Card, Badge, Table, Dialog, Select, etc.)
│   ├── layout/                          # Sidebar, SidebarNav, PageHeader
│   ├── dashboard/                       # MonthlyRevenueForm, CalculatedTotals, SubmissionStatus, DeadlineWarning
│   ├── admin/                           # OfficeStatusTable, ReportEditor, FeeManager, UserManager, DateRangeReportForm
│   └── reports/                         # ReportCard, ReportTable
├── lib/
│   ├── supabase/                        # client.ts, server.ts, admin.ts, middleware.ts
│   ├── stripe/                          # client.ts, invoices.ts
│   ├── email/templates.ts
│   ├── calculations.ts                  # Pure functions: totalGross, royaltyFee, advertisingFee
│   ├── constants.ts
│   └── types.ts
├── actions/                             # Server Actions
│   ├── reports.ts                       # submitReport, saveDraft, adminUpdateReport
│   ├── fees.ts                          # updateFeePercentage
│   ├── users.ts                         # createUser, suspendUser, deleteUser
│   └── offices.ts                       # createOffice, updateOffice, deactivateOffice
├── hooks/
│   ├── useReportCalculations.ts         # Real-time fee calc on input
│   └── useCurrentPeriod.ts              # Current month + deadline helpers
└── middleware.ts                        # Auth check + role-based redirects

supabase/
├── migrations/
│   ├── 00001_create_tables.sql
│   ├── 00002_create_rls_policies.sql
│   └── 00003_seed_admin.sql
└── functions/
    ├── send-reminder-emails/index.ts    # Cron: 1st of month
    ├── send-final-reminders/index.ts    # Cron: 5th of month
    └── on-report-submitted/index.ts     # Admin notification email
```

---

## Database Schema

### `offices`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | NOT NULL |
| office_number | text | NOT NULL, UNIQUE (e.g. "204") |
| address, phone | text | |
| email | text | NOT NULL |
| stripe_customer_id | text | nullable, set on first invoice |
| is_active | boolean | default true |
| created_at, updated_at | timestamptz | |

### `profiles` (extends auth.users via trigger)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, FK → auth.users(id) ON DELETE CASCADE |
| office_id | uuid | FK → offices(id), null for admins |
| role | text | 'admin' or 'sub_office' |
| full_name | text | NOT NULL |
| is_active | boolean | default true |
| created_at, updated_at | timestamptz | |

### `fee_configurations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| fee_type | text | 'royalty' or 'advertising' |
| percentage | numeric(5,4) | e.g. 0.0700 = 7% |
| effective_from | date | |
| effective_to | date | NULL = currently active |
| set_by | uuid | FK → profiles(id) |

Unique partial index: one active rate per fee_type (`WHERE effective_to IS NULL`).

### `monthly_reports`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| office_id | uuid | FK → offices(id) |
| report_month | date | 1st of month (e.g. '2026-03-01') |
| tax_preparation_fees | numeric(12,2) | |
| bookkeeping_fees | numeric(12,2) | |
| insurance_commissions | numeric(12,2) | |
| other_service_fees | numeric(12,2) | |
| total_gross | numeric(12,2) | Computed by trigger |
| royalty_percentage | numeric(5,4) | Snapshot at submission |
| advertising_percentage | numeric(5,4) | Snapshot at submission |
| royalty_fee | numeric(12,2) | Computed by trigger |
| advertising_fee | numeric(12,2) | Computed by trigger |
| total_fees_due | numeric(12,2) | Computed by trigger |
| status | text | 'draft' / 'submitted' / 'invoiced' / 'paid' / 'overdue' |
| submitted_at, submitted_by | timestamptz, uuid | |
| edited_by, edited_at | uuid, timestamptz | Last admin edit |
| stripe_invoice_id, stripe_invoice_url | text | |
| paid_at | timestamptz | |
| notes | text | |

UNIQUE constraint: `(office_id, report_month)`.

Postgres trigger `compute_report_fees()` runs BEFORE INSERT/UPDATE to calculate `total_gross`, `royalty_fee`, `advertising_fee`, `total_fees_due`.

### `audit_log`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → profiles(id) |
| action | text | e.g. 'report.submitted', 'fee.updated' |
| entity_type, entity_id | text, uuid | |
| changes | jsonb | old/new values |
| created_at | timestamptz | |

### `email_log`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| recipient_email | text | |
| template | text | 'reminder_first', 'reminder_final', etc. |
| subject | text | |
| status | text | 'sent' / 'failed' |
| error, metadata | text, jsonb | |
| created_at | timestamptz | |

### Row-Level Security

- **offices**: Sub offices see only their own; admins see all
- **profiles**: Users see/edit only themselves; admins have full CRUD
- **fee_configurations**: Sub offices see active rates only; admins manage all
- **monthly_reports**: Sub offices see/create/edit only their own drafts; admins have full access
- **audit_log**: Admin SELECT only; inserts via service-role
- **email_log**: No client access; written by Edge Functions

---

## Authentication

1. **Email/password only** — public signups disabled; admin creates accounts
2. **Profile trigger**: On `auth.users` insert → auto-create `profiles` row using `raw_user_meta_data` (role, full_name, office_id)
3. **Custom JWT claims hook**: Add `user_role` and `office_id` to JWT so middleware doesn't need a DB query per request
4. **Middleware** (`src/middleware.ts`):
   - Refresh Supabase session via `@supabase/ssr`
   - Redirect unauthenticated users → `/login`
   - `/office/*` → sub_office role only
   - `/admin/*` → admin role only
   - Mismatched roles redirected to their correct dashboard
   - `/api/webhooks/stripe` bypasses auth (verified by Stripe signature)

---

## Stripe Integration

1. **Lazy customer creation**: On first invoice, create Stripe Customer for the office, store `stripe_customer_id`
2. **Invoice flow** (in `submitReport` server action):
   - Create invoice items (royalty fee + advertising fee)
   - Create invoice with `collection_method: 'send_invoice'`, `days_until_due: 15`, payment methods: card + ACH
   - Send invoice via `stripe.invoices.sendInvoice()`
   - Store `stripe_invoice_id` + `stripe_invoice_url` on the report
3. **Webhook** (`/api/webhooks/stripe/route.ts`):
   - `invoice.paid` → status = 'paid', set `paid_at`
   - `invoice.payment_failed` → status = 'overdue'
   - Verified by Stripe signature

---

## Automated Emails (Supabase Edge Functions + SMTP)

Email sent via SMTP (configured in Supabase project settings or via Nodemailer in Edge Functions). Uses HTML email templates built in `lib/email/templates.ts`.

| Trigger | Function | Action |
|---------|----------|--------|
| 1st of month (pg_cron) | `send-reminder-emails` | Email offices without submitted reports |
| 5th of month (pg_cron) | `send-final-reminders` | Final urgent reminder |
| Report submitted (invoked from server action) | `on-report-submitted` | Admin notification email |

---

## Key Design Decisions

- **numeric types** (not float) for all money/percentage fields — avoids floating-point precision bugs visible in the reference screenshot
- **Fee percentage snapshots** on reports — changing rates doesn't retroactively alter submitted reports
- **DB trigger for fee computation** — Postgres can't chain generated columns, so a BEFORE trigger computes derived fields
- **shadcn/ui** for all primitives — consistent design language, customizable via CSS variables, built on Radix UI
- **Server Actions** for all mutations — type-safe, colocated, progressive enhancement
- **Edge Functions + SMTP for emails** — avoids third-party email service dependency; SMTP config is flexible (Gmail, Mailgun, etc.)
- **Edge Functions for cron emails** — avoids Vercel cron limitations, stays within Supabase ecosystem
- **Fee formulas are placeholder** — using `Total Gross × Percentage` for both royalty and advertising until final formulas are confirmed

---

## Brand / Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| navy-900 | #0A1E33 | Sidebar background |
| navy-800 | #0F2B46 | Calculated totals section |
| red-600 | #DC2626 | CTA buttons, deadline warning |
| red-700 | #B91C1C | CTA hover |
| gray-50 | #F9FAFB | Page background |
| gray-500 | #6B7280 | Secondary text, labels |
| Font | Inter / system-ui | |

---

## Implementation Phases

### Phase 1: Foundation
- Init Next.js project at repo root `/workspaces/danielahart/` (App Router, TS, Tailwind)
- Init shadcn/ui (`npx shadcn@latest init`) and install core components: Button, Input, Card, Badge, Table, Dialog, Select, Label, Separator, Dropdown Menu, Tabs, Toast (sonner)
- Customize shadcn theme with brand colors (navy + red palette) in `globals.css` / `tailwind.config.ts`
- Set up new Supabase project via CLI (`supabase init` + `supabase start` for local dev)
- Run all migrations (tables, triggers, indexes, RLS)
- Configure Supabase Auth (disable signups, JWT claims hook, profile trigger)
- Create `lib/supabase/` client utilities (`@supabase/ssr`)
- Implement `middleware.ts` (session refresh + role routing)
- Build login page
- Seed admin user + test office

### Phase 2: Sub Office Dashboard
- Build dashboard layout (Sidebar, PageHeader, role-aware nav)
- Build MonthlyRevenueForm with 4 fee inputs + real-time calculation
- Build CalculatedTotals dark section + SubmissionStatus + DeadlineWarning
- Implement `saveDraft` server action
- Build Past Reports page (read-only table)
- Build Account Settings page (password change)

### Phase 3: Stripe Integration
- Implement `lib/stripe/invoices.ts` (customer creation, invoice items, send)
- Wire "Confirm & Generate Stripe Invoice" button → `submitReport` action
- Build webhook handler at `/api/webhooks/stripe`
- Enable ACH payments in Stripe dashboard
- End-to-end test: submit → invoice → pay → status update

### Phase 4: Admin Panel
- Build admin dashboard with OfficeStatusTable
- Build office detail page with ReportEditor
- Build fee management page (FeeManager + FeeHistoryTable)
- Build user management page (add/suspend/delete)
- Build date-range report page + CSV export

### Phase 5: Automated Emails
- Configure SMTP settings (provider TBD — Gmail, Mailgun, etc.)
- Build HTML email templates in `lib/email/templates.ts`
- Deploy Edge Functions (reminder, final reminder, admin notification) using SMTP
- Configure pg_cron schedules
- Test all email flows

### Phase 6: Polish & Deploy
- Loading states (Suspense, skeletons), error handling (toast via sonner)
- Form validation with zod (shared client/server schemas)
- Responsive design (sidebar → hamburger on tablet)
- Audit log writes on all mutations
- Security review (RLS policy testing per role)
- Deploy to Vercel, configure env vars + custom domain

---

## Verification

1. **Auth**: Log in as sub_office → redirected to `/office/dashboard`; log in as admin → `/admin/dashboard`; unauthenticated → `/login`
2. **Report submission**: Enter fees → verify real-time calculation → submit → Stripe invoice created → check Stripe dashboard → pay invoice → verify status updates to "paid"
3. **Admin editing**: Admin edits a submitted report → verify audit_log entry created
4. **Fee changes**: Admin updates royalty % → verify old rate gets `effective_to` set, new rate active, existing reports unchanged
5. **Emails**: Manually trigger Edge Functions → verify emails sent and logged in `email_log`
6. **RLS**: Attempt cross-office data access as sub_office user → verify denied
