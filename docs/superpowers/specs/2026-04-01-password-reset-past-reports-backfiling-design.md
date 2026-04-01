# Admin Password Reset, Past Reports with Unfiled Months, and Prior Month Filing

## Context

Three features needed to complete the portal's core functionality:
1. Admins cannot reset user passwords — only set them at creation
2. Past reports page only shows filed reports, hiding months where no report was submitted
3. Franchisees can only file reports for the current month, not prior unfiled months

---

## Feature 1: Admin Reset Password

### Behavior

- New "Reset Password" action in the user row dropdown (or as a button) in `UserManager.tsx`
- Opens a dialog with a single password input (min 8 characters) and confirm button
- Calls `resetUserPassword(userId, newPassword)` server action
- Uses `supabase.auth.admin.updateUserById(userId, { password })` to set the new password
- Success toast: "Password updated successfully"
- Audit logged with action `reset_password`

### Files to modify

- `src/actions/users.ts` — add `resetUserPassword` action
- `src/components/admin/UserManager.tsx` — add reset password dialog and button

---

## Feature 2: Past Reports — Show All Months Including Unfiled

### Behavior

- Generate a continuous month list from the office's `created_at` date through the current month
- Query all `monthly_reports` for the office (excluding drafts)
- Merge: months with a report show the existing data; months without show as "Unfiled"
- Unfiled months display a "File Report" link that navigates to `/office/dashboard?month=YYYY-MM-01`
- Sort descending (newest first)

### Files to modify

- `src/app/(dashboard)/office/past-reports/page.tsx` — generate full month list, fetch office created_at, merge with reports

---

## Feature 3: Dashboard — File Prior Month Reports

### Behavior

- Accept optional `?month=YYYY-MM-01` URL search param on the office dashboard
- If provided and the month is valid (not in the future, not before office creation), use it as the active month
- If not provided, default to current month (existing behavior)
- Show a "Filing for: [Month Year]" indicator when viewing a non-current month
- Show a "Back to current month" link when viewing a prior month
- Deadline warning only displays for the current month
- `saveDraft` and `submitReport` already accept arbitrary `report_month` — the form just needs to pass the selected month instead of hardcoded current month
- If the prior month already has a submitted/invoiced/paid report, form fields are disabled (same as current behavior)

### Files to modify

- `src/app/(dashboard)/office/dashboard/page.tsx` — read `month` search param, pass to client
- `src/app/(dashboard)/office/dashboard/client.tsx` — accept and use the month param, show indicator
- `src/components/dashboard/MonthlyRevenueForm.tsx` — use passed `reportMonth` prop instead of hardcoded current month
- `src/components/dashboard/DeadlineWarning.tsx` — only show for current month

---

## Verification

1. **Password reset**: Admin opens user manager → clicks reset password on a user → enters new password → user can log in with new password
2. **Past reports**: Franchisee views past reports → sees all months from account creation through now → unfiled months show "Unfiled" status with "File Report" link
3. **Prior month filing**: Click "File Report" on an unfiled month → navigates to dashboard with that month → form shows empty → can save draft and submit → invoice created for that month → past reports page now shows it as filed
