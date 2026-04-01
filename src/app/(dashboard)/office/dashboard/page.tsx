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
