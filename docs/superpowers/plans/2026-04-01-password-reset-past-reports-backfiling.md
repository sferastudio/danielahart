# Password Reset, Past Reports with Unfiled Months, Prior Month Filing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin password reset for users, show all months (including unfiled) in past reports, and allow franchisees to file prior month reports from the dashboard.

**Architecture:** Add a `resetUserPassword` server action using Supabase admin API. Rewrite past-reports page to generate a full month list from office creation through current month and merge with existing reports. Accept a `?month=` search param on the office dashboard to enable filing for any prior month.

**Tech Stack:** Next.js 16 App Router, Supabase Auth Admin API, TypeScript, existing shadcn/ui components.

---

### Task 1: Add resetUserPassword Server Action

**Files:**
- Modify: `src/actions/users.ts`

- [ ] **Step 1: Add the resetUserPassword action**

Add the following export to the end of `src/actions/users.ts`:

```typescript
export async function resetUserPassword(userId: string, newPassword: string) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  if (!newPassword || newPassword.length < 8)
    return { success: false, error: "Password must be at least 8 characters" };

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "reset_password",
    entity_type: "profile",
    entity_id: userId,
    changes: { password_reset: true },
  });

  return { success: true };
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/actions/users.ts
git commit -m "feat: add resetUserPassword server action"
```

---

### Task 2: Add Reset Password UI to UserManager

**Files:**
- Modify: `src/components/admin/UserManager.tsx`

- [ ] **Step 1: Add import for resetUserPassword**

In `src/components/admin/UserManager.tsx`, change the import line:

Old:
```typescript
import { createUser, updateUserStatus, deleteUser } from "@/actions/users";
```

New:
```typescript
import { createUser, updateUserStatus, deleteUser, resetUserPassword } from "@/actions/users";
```

- [ ] **Step 2: Add state for the reset password dialog**

After the existing `form` state declaration (around line 73), add:

```typescript
const [showResetPassword, setShowResetPassword] = useState(false);
const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
const [newPassword, setNewPassword] = useState("");
```

- [ ] **Step 3: Add the handleResetPassword function**

After the `handleDelete` function (around line 142), add:

```typescript
function handleResetPassword() {
  if (!resetTarget) return;
  startTransition(async () => {
    const result = await resetUserPassword(resetTarget.id, newPassword);
    if (result.success) {
      toast.success(`Password updated for ${resetTarget.name}`);
      setShowResetPassword(false);
      setResetTarget(null);
      setNewPassword("");
    } else {
      toast.error(result.error ?? "Failed to reset password");
    }
  });
}
```

- [ ] **Step 4: Add Reset Password button to user row actions**

In the actions `<div className="flex gap-2">` section (around line 216), add a new Button between the Suspend and Delete buttons:

```tsx
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResetTarget({ id: profile.id, name: profile.full_name });
                        setNewPassword("");
                        setShowResetPassword(true);
                      }}
                      disabled={isPending}
                    >
                      Reset Password
                    </Button>
```

- [ ] **Step 5: Add the Reset Password dialog**

After the Create User `</Dialog>` closing tag (around line 424), add:

```tsx
      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Set a new password for <strong>{resetTarget?.name}</strong>.
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPassword(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isPending || newPassword.length < 8}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              {isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 6: Verify it builds**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/UserManager.tsx
git commit -m "feat: add reset password dialog to admin user management"
```

---

### Task 3: Rewrite Past Reports to Show All Months Including Unfiled

**Files:**
- Modify: `src/app/(dashboard)/office/past-reports/page.tsx`

- [ ] **Step 1: Rewrite the past-reports page**

Replace the entire content of `src/app/(dashboard)/office/past-reports/page.tsx` with:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download } from "lucide-react";
import Link from "next/link";
import { CURRENCY_FORMATTER, PERCENTAGE_FORMATTER } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  submitted: "bg-blue-100 text-blue-800",
  invoiced: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

function generateMonthList(fromDate: Date, toDate: Date): string[] {
  const months: string[] = [];
  const startY = fromDate.getFullYear();
  const startM = fromDate.getMonth();
  const endY = toDate.getFullYear();
  const endM = toDate.getMonth();

  for (let y = endY, m = endM; y > startY || (y === startY && m >= startM); m--) {
    if (m < 0) { m = 11; y--; continue; }
    months.push(`${y}-${String(m + 1).padStart(2, "0")}-01`);
  }
  return months;
}

export default async function PastReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const office_id =
    user.app_metadata?.office_id ?? user.user_metadata?.office_id;

  // Fetch office creation date for month range
  const { data: office } = await supabase
    .from("offices")
    .select("created_at")
    .eq("id", office_id)
    .single();

  const officeCreated = office?.created_at
    ? new Date(office.created_at)
    : new Date();

  // Generate all months from office creation through current month
  const now = new Date();
  const allMonths = generateMonthList(officeCreated, now);

  // Fetch all filed reports (excluding drafts)
  const { data: reports } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("office_id", office_id)
    .neq("status", "draft");

  // Index reports by month
  const reportsByMonth = new Map(
    (reports ?? []).map((r) => [r.report_month, r])
  );

  return (
    <div className="space-y-6">
      <PageHeader title="PAST REPORTS" subtitle="FRANCHISEE PORTAL" />

      <div className="rounded-lg bg-white p-4 md:p-6 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Total Gross</TableHead>
                <TableHead className="text-right">Royalty Fee</TableHead>
                <TableHead className="text-right">Advertising Fee</TableHead>
                <TableHead className="text-right">Total Fees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allMonths.map((month) => {
                const report = reportsByMonth.get(month);
                const monthDate = new Date(month + "T00:00:00");
                const monthLabel = monthDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });

                if (!report) {
                  // Unfiled month
                  return (
                    <TableRow key={month} className="bg-slate-50/50">
                      <TableCell className="font-medium">{monthLabel}</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                          Unfiled
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/office/dashboard?month=${month}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-red hover:underline"
                        >
                          File Report
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                }

                // Filed month
                return (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{monthLabel}</TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.total_gross)}
                    </TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.royalty_fee)}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({PERCENTAGE_FORMATTER(Number(report.royalty_percentage))})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.advertising_fee)}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({PERCENTAGE_FORMATTER(Number(report.advertising_percentage))})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.total_fees_due)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_CLASSES[report.status] ?? ""}
                      >
                        {report.status.charAt(0).toUpperCase() +
                          report.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {report.status === "invoiced" && report.stripe_invoice_url && (
                        <a
                          href={report.stripe_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-red hover:underline"
                        >
                          Pay Invoice <ExternalLink className="size-3" />
                        </a>
                      )}
                      {report.status === "paid" && report.stripe_invoice_url && (
                        <a
                          href={report.stripe_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline"
                        >
                          View Receipt <ExternalLink className="size-3" />
                        </a>
                      )}
                      {report.stripe_invoice_pdf && (
                        <a
                          href={report.stripe_invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:underline"
                        >
                          PDF <Download className="size-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/office/past-reports/page.tsx
git commit -m "feat: show all months including unfiled in past reports"
```

---

### Task 4: Accept month param on Office Dashboard Page

**Files:**
- Modify: `src/app/(dashboard)/office/dashboard/page.tsx`

- [ ] **Step 1: Update the page to accept and validate a month search param**

Replace the entire content of `src/app/(dashboard)/office/dashboard/page.tsx` with:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OfficeDashboardClient } from "./client";

export default async function OfficeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const office_id =
    user.app_metadata?.office_id ?? user.user_metadata?.office_id;

  // Fetch per-office fee rates
  const { data: office } = await supabase
    .from("offices")
    .select("royalty_percentage, advertising_percentage")
    .eq("id", office_id)
    .single();

  const royaltyPercentage = Number(office?.royalty_percentage ?? 0.10);
  const advertisingPercentage = Number(office?.advertising_percentage ?? 0.02);

  // Determine report month: use ?month= param if valid, else current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const params = await searchParams;
  let reportMonth = currentMonth;
  if (params.month && /^\d{4}-\d{2}-01$/.test(params.month)) {
    const paramDate = new Date(params.month + "T00:00:00");
    const nowDate = new Date(currentMonth + "T00:00:00");
    // Allow past months up to current month, not future
    if (paramDate <= nowDate) {
      reportMonth = params.month;
    }
  }

  const isCurrentMonth = reportMonth === currentMonth;

  // Fetch report for the selected month
  const { data: currentReport } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("office_id", office_id)
    .eq("report_month", reportMonth)
    .maybeSingle();

  // Fetch recent reports for submission status sidebar
  const { data: recentReports } = await supabase
    .from("monthly_reports")
    .select("report_month, status, paid_at")
    .eq("office_id", office_id)
    .order("report_month", { ascending: false })
    .limit(12);

  return (
    <OfficeDashboardClient
      reportMonth={reportMonth}
      isCurrentMonth={isCurrentMonth}
      royaltyPercentage={royaltyPercentage}
      advertisingPercentage={advertisingPercentage}
      currentReport={currentReport}
      recentReports={recentReports ?? []}
    />
  );
}
```

- [ ] **Step 2: Verify it builds (will fail — client component needs update next)**

This is expected to have type errors until Task 5 is complete.

- [ ] **Step 3: Commit (after Task 5)**

---

### Task 5: Update Office Dashboard Client for Prior Month Filing

**Files:**
- Modify: `src/app/(dashboard)/office/dashboard/client.tsx`

- [ ] **Step 1: Update the client component to handle prior months**

Replace the entire content of `src/app/(dashboard)/office/dashboard/client.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthlyRevenueForm } from "@/components/dashboard/MonthlyRevenueForm";
import { SubmissionStatus } from "@/components/dashboard/SubmissionStatus";
import { DeadlineWarning } from "@/components/dashboard/DeadlineWarning";
import { useCurrentPeriod } from "@/hooks/useCurrentPeriod";
import { Toaster } from "sonner";
import { ArrowLeft } from "lucide-react";

interface RecentReport {
  report_month: string;
  status: string;
  paid_at: string | null;
}

interface OfficeDashboardClientProps {
  reportMonth: string;
  isCurrentMonth: boolean;
  royaltyPercentage: number;
  advertisingPercentage: number;
  currentReport: {
    tax_preparation_fees: number;
    bookkeeping_fees: number;
    insurance_commissions: number;
    notary_copy_fax_fees: number;
    translation_document_fees: number;
    other_service_fees: number;
    status: string;
    stripe_invoice_url: string | null;
  } | null;
  recentReports: RecentReport[];
}

export function OfficeDashboardClient({
  reportMonth,
  isCurrentMonth,
  royaltyPercentage,
  advertisingPercentage,
  currentReport,
  recentReports,
}: OfficeDashboardClientProps) {
  const period = useCurrentPeriod();

  const reportMonthDate = new Date(reportMonth + "T00:00:00");
  const reportMonthLabel = reportMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthStatuses = recentReports.map((r) => {
    const date = new Date(r.report_month + "T00:00:00");
    const monthLabel = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const paidDate = r.paid_at
      ? new Date(r.paid_at).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
      : undefined;

    return {
      month: monthLabel,
      status: r.status as
        | "paid"
        | "submitted"
        | "invoiced"
        | "draft"
        | "overdue"
        | "none",
      date: paidDate,
    };
  });

  return (
    <>
      <Toaster richColors position="top-right" />

      <PageHeader
        title="Dashboard"
        subtitle="Franchisee Portal"
        periodLabel="Reporting Period"
        periodValue={isCurrentMonth ? period.current_month : reportMonthLabel}
        daysRemaining={isCurrentMonth ? period.days_remaining : undefined}
        isOverdue={isCurrentMonth ? period.is_overdue : undefined}
      />

      {/* Prior month banner */}
      {!isCurrentMonth && (
        <div className="mx-4 md:mx-10 mt-4 flex items-center justify-between rounded-[4px] border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">
            Filing report for <strong>{reportMonthLabel}</strong>
          </p>
          <Link
            href="/office/dashboard"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
          >
            <ArrowLeft className="size-3" />
            Back to current month
          </Link>
        </div>
      )}

      <div className="px-4 md:px-10 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form — 8 cols */}
          <div className="lg:col-span-8">
            <MonthlyRevenueForm
              reportMonth={reportMonth}
              formattedDeadline={isCurrentMonth ? period.formatted_deadline : `FOR ${reportMonthLabel.toUpperCase()}`}
              royaltyPercentage={royaltyPercentage}
              advertisingPercentage={advertisingPercentage}
              reportStatus={currentReport?.status}
              stripeInvoiceUrl={currentReport?.stripe_invoice_url}
              initialValues={
                currentReport
                  ? {
                      tax_preparation_fees: Number(
                        currentReport.tax_preparation_fees
                      ),
                      bookkeeping_fees: Number(
                        currentReport.bookkeeping_fees
                      ),
                      insurance_commissions: Number(
                        currentReport.insurance_commissions
                      ),
                      notary_copy_fax_fees: Number(
                        currentReport.notary_copy_fax_fees
                      ),
                      translation_document_fees: Number(
                        currentReport.translation_document_fees
                      ),
                      other_service_fees: Number(
                        currentReport.other_service_fees
                      ),
                    }
                  : undefined
              }
            />
          </div>

          {/* Right Sidebar — 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <SubmissionStatus months={monthStatuses} />
            {isCurrentMonth && !period.is_overdue && period.days_remaining <= 5 && !currentReport?.status?.match(/^(submitted|invoiced|paid)$/) && (
              <DeadlineWarning />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit both Task 4 and Task 5 together**

```bash
git add src/app/\(dashboard\)/office/dashboard/page.tsx src/app/\(dashboard\)/office/dashboard/client.tsx
git commit -m "feat: allow franchisees to file reports for prior months via ?month= param"
```

---

## Verification

1. **Password reset**: Admin → Users → click "Reset Password" on any user → enter new password → success toast → user can log in with new password
2. **Past reports**: Franchisee → Past Reports → see all months from account creation through current → unfiled months show "Unfiled" badge with "File Report" link
3. **Prior month filing**: Click "File Report" on unfiled month → dashboard loads with that month → blue banner shows "Filing report for [Month]" → can save draft/submit → navigates back shows report filed
4. **Current month unchanged**: Dashboard without `?month=` param behaves exactly as before — deadline warning, current period display, etc.
