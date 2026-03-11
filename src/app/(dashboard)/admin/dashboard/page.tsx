import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { OfficeStatusTable } from "@/components/admin/OfficeStatusTable";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const now = new Date();
  const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Fetch all offices
  const { data: offices } = await admin
    .from("offices")
    .select("*")
    .order("name");

  // Fetch current month reports for all offices
  const { data: reports } = await admin
    .from("monthly_reports")
    .select("*")
    .eq("report_month", reportMonth);

  // Merge offices with their current month report
  const officeData = (offices ?? []).map((office) => {
    const report = reports?.find((r) => r.office_id === office.id);
    return { ...office, currentReport: report ?? null };
  });

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Franchise Management"
        periodLabel="Current Period"
        periodValue={new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
      />
      <div className="px-10 py-10">
        <OfficeStatusTable offices={officeData} />
      </div>
    </>
  );
}
