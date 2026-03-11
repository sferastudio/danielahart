import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { report_id } = await req.json();

  if (!report_id) {
    return new Response(
      JSON.stringify({ error: "report_id required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch the report with office details
  const { data: report } = await supabase
    .from("monthly_reports")
    .select("*, offices(name, email, office_number)")
    .eq("id", report_id)
    .single();

  if (!report) {
    return new Response(
      JSON.stringify({ error: "Report not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch admin users to notify
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true);

  const office = report.offices;
  const reportDate = new Date(report.report_month + "T00:00:00");
  const monthLabel = reportDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Log notification for each admin
  for (const admin of admins ?? []) {
    await supabase.from("email_log").insert({
      recipient_email: `admin-${admin.id}`,
      template: "admin_notification",
      subject: `Report Submitted: ${office?.name ?? "Unknown"} — ${monthLabel}`,
      status: "sent",
      metadata: {
        report_id,
        office_name: office?.name,
        total_gross: report.total_gross,
        total_fees_due: report.total_fees_due,
      },
    });
  }

  return new Response(
    JSON.stringify({ message: "Admin notifications sent" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
