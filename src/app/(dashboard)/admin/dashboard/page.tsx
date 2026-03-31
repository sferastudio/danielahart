import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import { AuditLogEntry } from "@/lib/types";

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const params = await searchParams;

  // Fetch earliest report month to build the full month range
  const { data: earliestRow } = await admin
    .from("monthly_reports")
    .select("report_month")
    .order("report_month", { ascending: true })
    .limit(1);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Build continuous month list from earliest data through current month (descending)
  const allMonths: string[] = [];
  const earliest = earliestRow?.[0]?.report_month ?? currentMonth;
  const [startY, startM] = earliest.split("-").map(Number);
  const [endY, endM] = currentMonth.split("-").map(Number);
  for (let y = endY, m = endM; y > startY || (y === startY && m >= startM); m--) {
    if (m < 1) { m = 12; y--; }
    allMonths.push(`${y}-${String(m).padStart(2, "0")}-01`);
  }

  // Determine which month to display — accept any month in range, default to current
  const reportMonth =
    params.month && allMonths.includes(params.month)
      ? params.month
      : currentMonth;

  // Previous month for revenue comparison
  const [year, month] = reportMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { data: offices },
    { data: reports },
    { data: prevReports },
    { data: auditLog },
  ] = await Promise.all([
    admin.from("offices").select("*").order("name"),
    admin.from("monthly_reports").select("*").eq("report_month", reportMonth),
    admin.from("monthly_reports").select("*").eq("report_month", prevMonth),
    admin
      .from("audit_log")
      .select("*, profile:profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Merge offices with their selected month report
  const officeData = (offices ?? []).map((office) => {
    const report = reports?.find((r) => r.office_id === office.id);
    return { ...office, currentReport: report ?? null };
  });

  const stats = computeDashboardStats(officeData, prevReports ?? []);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Franchise Management"
        periodLabel="Viewing Period"
        periodValue={formatMonthLabel(reportMonth)}
      />
      <AdminDashboardClient
        offices={officeData}
        stats={stats}
        auditLog={(auditLog ?? []) as AuditLogEntry[]}
        reportMonth={reportMonth}
        availableMonths={allMonths}
      />
    </>
  );
}
