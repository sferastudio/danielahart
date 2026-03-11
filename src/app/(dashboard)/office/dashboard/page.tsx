import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OfficeDashboardClient } from "./client";

export default async function OfficeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const office_id =
    user.app_metadata?.office_id ?? user.user_metadata?.office_id;

  // Fetch per-office fee rates from the offices table
  const { data: office } = await supabase
    .from("offices")
    .select("royalty_percentage, advertising_percentage")
    .eq("id", office_id)
    .single();

  const royaltyPercentage = Number(office?.royalty_percentage ?? 0.10);
  const advertisingPercentage = Number(office?.advertising_percentage ?? 0.02);

  // Fetch current month report if exists (any status)
  const now = new Date();
  const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: currentReport } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("office_id", office_id)
    .eq("report_month", reportMonth)
    .maybeSingle();

  // Fetch recent reports for submission status
  const { data: recentReports } = await supabase
    .from("monthly_reports")
    .select("report_month, status, paid_at")
    .eq("office_id", office_id)
    .order("report_month", { ascending: false })
    .limit(12);

  return (
    <OfficeDashboardClient
      reportMonth={reportMonth}
      royaltyPercentage={royaltyPercentage}
      advertisingPercentage={advertisingPercentage}
      currentReport={currentReport}
      recentReports={recentReports ?? []}
    />
  );
}
