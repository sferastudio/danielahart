import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangeReportForm } from "@/components/admin/DateRangeReportForm";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all offices for the filter
  const { data: offices } = await admin
    .from("offices")
    .select("id, name, office_number, royalty_percentage, advertising_percentage, status")
    .order("name");

  // Default: fetch current month reports
  const now = new Date();
  const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: reports } = await admin
    .from("monthly_reports")
    .select("*, offices(name, office_number)")
    .gte("report_month", reportMonth)
    .lte("report_month", reportMonth)
    .order("offices(name)");

  return (
    <>
      <PageHeader title="Reports" subtitle="Admin Portal" />
      <div className="px-10 py-10">
        <DateRangeReportForm
          offices={offices ?? []}
          initialReports={reports ?? []}
        />
      </div>
    </>
  );
}
