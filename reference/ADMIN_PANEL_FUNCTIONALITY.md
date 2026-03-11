# Admin Panel — Functionality Plan

## Overview

The admin panel provides franchise management capabilities for Daniel Ahart Tax Service. This document describes all admin-facing features, their database backing, and how they map to the legacy system's functionality.

---

## 1. Monthly Sales Entry

**Route:** `/admin/monthly-sales`
**Components:** `AdminMonthlySalesForm.tsx`
**Server Actions:** `adminSaveReport()` in `src/actions/reports.ts`

### Functionality

- **Franchisee Dropdown:** Admin selects any active office (e.g., Conyers, Alpharetta) from a dropdown at the top of the page.
- **Month Navigation:** `<< Prev Month` / `Next Month >>` buttons navigate between months. Current month displayed prominently in the center. URL params update as `?office={id}&month=YYYY-MM`.
- **Revenue Entry Form:** Six-field form matching `REVENUE_FIELDS` from constants:
  1. Tax Preparation Fees
  2. Bookkeeping Fees
  3. Insurance Commissions
  4. Notary, Copy, Fax & Computer Fees
  5. Translation & Document Prep
  6. Other Misc. Fees
- **Live Calculations:** As values are entered, the summary section updates in real-time:
  - Total Gross Revenue (sum of all 6 fields)
  - Royalty Rate (from office record)
  - Royalty Due (gross × royalty rate)
  - Advertising Rate (from office record)
  - Advertising Fee Due (gross × advertising rate)
- **Save:** Upserts the report for the selected office+month. If a report already exists, it is overwritten. The admin's user ID is recorded as `edited_by`.
- **Auto-Load:** When navigating to a month that already has a report, values are pre-populated from the database.

### Database

- Reads/writes `monthly_reports` table via upsert on `(office_id, report_month)` unique constraint.
- Reads `offices` table for royalty/advertising percentages.

---

## 2. Sales Reports

**Route:** `/admin/reports`
**Components:** `DateRangeReportForm.tsx`
**Server Actions:** `toggleProcessed()` in `src/actions/reports.ts`

### Functionality

- **Date Range Filter:** Start Month and End Month inputs to define the reporting period.
- **Office Filter:** Optional dropdown to filter reports to a single franchisee.
- **Generate Report:** Fetches all matching `monthly_reports` rows with joined office data.
- **Processed Checkbox ("PROC."):** Each report row has a checkbox. Toggling it calls `toggleProcessed(reportId)` which flips the `is_processed` boolean on that report. State persists across page refreshes.
- **$0 Reports Filter:** A toggle button that, when active, filters the table client-side to show only reports where `total_gross === 0`. Matches the legacy "$0 Monthly Sales Reports" nav item.
- **Clickable Month Links:** When a specific office is selected in the filter, month names in the table become hyperlinks to `/admin/monthly-sales?office={id}&month=YYYY-MM`, allowing the admin to jump directly into editing that report.
- **Export CSV:** Downloads all visible (filtered) rows as a CSV file including a totals row. Includes the "Processed" column.
- **Totals Row:** Bottom of the table shows summed Gross, Royalty Due, and Advertising Fee.

### Database

- Reads `monthly_reports` joined with `offices(name, office_number)`.
- Writes `monthly_reports.is_processed` via toggle action.

---

## 3. Manage Royalty Percentage

**Route:** `/admin/fees/royalty`
**Components:** `FeeHistoryManager.tsx` (with `feeType="royalty"`)
**Server Actions:** `saveFeeHistory()`, `getFeeHistory()` in `src/actions/fees.ts`

### Functionality

- **Franchisee Dropdown:** Select an office to manage its royalty fee history.
- **Fee History Table:** Displays historical rows with columns:
  - Fee % (decimal, e.g., `0.12` = 12%)
  - Start Month/Year (date picker)
  - End Month/Year (date picker, or "Ongoing" if null)
- **Example (Alpharetta):**
  | Fee % | Start | End |
  |-------|-------|-----|
  | 0.12 (12%) | Jan 2013 | Dec 2017 |
  | 0.10 (10%) | Jan 2018 | May 2021 |
  | 0.06 (6%) | Jun 2021 | Ongoing |
- **Inline Editing:** All fields are editable directly in the table.
- **Add Row:** Button to append a new fee period.
- **Remove Row:** Trash icon to delete a historical row.
- **Set End Date:** For ongoing rows, a button converts "Ongoing" to a date input.
- **Save Changes:** Replaces all fee history rows for the selected office+feeType (delete then insert). Also updates the office's current `royalty_percentage` to match the ongoing row.
- **All Offices Overview:** Below the history editor, a read-only table lists every office with its current royalty rate. Clicking a row selects that office for editing.

### Database

- `fee_rate_history` table: `(office_id, fee_type, percentage, start_month, end_month)`.
- On save, also updates `offices.royalty_percentage` to the ongoing row's value.

---

## 4. Manage Advertising Fee Percentage

**Route:** `/admin/fees/advertising`
**Components:** `FeeHistoryManager.tsx` (with `feeType="advertising"`)
**Server Actions:** Same as Royalty — `saveFeeHistory()`, `getFeeHistory()`

### Functionality

Identical to Manage Royalty % (Section 3) but operates on advertising fee rates. Updates `offices.advertising_percentage` on save.

---

## 5. User Management

**Route:** `/admin/users`
**Components:** `UserManager.tsx`
**Server Actions:** `createUser()`, `updateUserStatus()`, `deleteUser()` in `src/actions/users.ts`

### Functionality

- **User Table:** Lists all users with Name, Role (Admin/Sub-Office), Office assignment, Status (Active/Suspended), and Created date.
- **Add New User Dialog:** Expanded form with fields matching the legacy system:
  - Contact First Name, Contact Last Name
  - Location Name (office dropdown)
  - Dealer Email (used as username/login)
  - Password
  - Full Name
  - Phone, Fax
  - Address, City, Province/State, Postal/Zip
  - Login Access checkbox → sets `is_active` on the profile
  - Administrative Access checkbox → sets `role` to `admin` or `sub_office`
- **Office Address Sync:** When creating a user with an office assignment, the phone, fax, address, city, state, and zip values are written to the `offices` table as well.
- **Suspend/Reactivate:** Toggle button per user row.
- **Delete:** Permanently removes the user from Supabase Auth and cascades.

### Database

- Creates user in Supabase Auth via admin client.
- Updates `profiles` table: `contact_first_name`, `contact_last_name`.
- Updates `offices` table: `phone`, `fax`, `address`, `city`, `state`, `zip`.

---

## 6. Offices

**Route:** `/admin/offices` and `/admin/offices/[officeId]`
**Existing functionality** — not modified in this update.

### Functionality

- List all offices with status, contact info, and fee rates.
- Detail page per office with report history and edit capabilities.

---

## 7. Dashboard

**Route:** `/admin/dashboard`
**Existing functionality** — not modified in this update.

### Functionality

- Overview metrics: total offices, pending reports, revenue summaries.

---

## 8. Settings

**Route:** `/admin/settings`
**Existing functionality** — not modified in this update.

---

## Admin Sidebar Navigation

The sidebar follows this structure (matching the legacy system's navigation):

| Order | Label | Route | Icon |
|-------|-------|-------|------|
| 1 | Dashboard | `/admin/dashboard` | LayoutDashboard |
| 2 | Monthly Sales | `/admin/monthly-sales` | DollarSign |
| 3 | Sales Reports | `/admin/reports` | FileText |
| 4 | Offices | `/admin/offices` | Building2 |
| 5 | Users | `/admin/users` | Users |
| 6 | Manage Royalty % | `/admin/fees/royalty` | Percent |
| 7 | Manage Advertising % | `/admin/fees/advertising` | Megaphone |
| 8 | Settings | `/admin/settings` | Settings |

---

## Database Schema Additions

### New Columns

| Table | Column | Type | Default | Description |
|-------|--------|------|---------|-------------|
| `monthly_reports` | `is_processed` | `boolean` | `false` | Admin marks report as processed |
| `offices` | `city` | `text` | `null` | Office city |
| `offices` | `state` | `text` | `'GA'` | Office state/province |
| `offices` | `zip` | `text` | `null` | Postal/zip code |
| `offices` | `fax` | `text` | `null` | Fax number |
| `profiles` | `contact_first_name` | `text` | `null` | Contact person first name |
| `profiles` | `contact_last_name` | `text` | `null` | Contact person last name |

### New Table: `fee_rate_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, auto-generated | Row identifier |
| `office_id` | `uuid` | FK → `offices(id)`, NOT NULL | Which office |
| `fee_type` | `text` | CHECK `('royalty', 'advertising')` | Fee category |
| `percentage` | `numeric(5,4)` | NOT NULL | Rate as decimal (0.06 = 6%) |
| `start_month` | `date` | NOT NULL | Period start |
| `end_month` | `date` | nullable | Period end, NULL = ongoing |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Record created |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Record updated |

**RLS Policies:**
- Admins: full CRUD access
- Sub-office users: read-only on their own office's rows

---

## File Map

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/admin/monthly-sales/page.tsx` | Monthly sales entry page |
| `src/components/admin/AdminMonthlySalesForm.tsx` | Franchisee selector, month nav, 6-field form, calculations |
| `src/app/(dashboard)/admin/fees/royalty/page.tsx` | Manage Royalty % page |
| `src/app/(dashboard)/admin/fees/advertising/page.tsx` | Manage Advertising % page |
| `src/components/admin/FeeHistoryManager.tsx` | Date-range fee history editor (shared by both fee pages) |
| `src/components/admin/DateRangeReportForm.tsx` | Reports table with PROC. checkbox, $0 filter, clickable months |
| `src/components/admin/UserManager.tsx` | Expanded user creation form with address/contact/access fields |
| `src/actions/reports.ts` | `adminSaveReport()`, `toggleProcessed()`, `submitReport()`, etc. |
| `src/actions/fees.ts` | `saveFeeHistory()`, `getFeeHistory()`, `updateOfficeFees()` |
| `src/actions/users.ts` | `createUser()` (expanded), `updateUserStatus()`, `deleteUser()` |
| `src/lib/types.ts` | TypeScript interfaces including `FeeRateHistory`, expanded `Office`/`Profile`/`MonthlyReport` |
| `src/app/(dashboard)/layout.tsx` | Sidebar nav item definitions |
| `src/app/(dashboard)/sidebar-nav.tsx` | Icon registry (added DollarSign, Megaphone) |
| `supabase/migrations/00006_admin_enhancements.sql` | Migration file for all schema changes |
