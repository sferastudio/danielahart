import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Get all active offices
  const { data: offices } = await supabase
    .from("offices")
    .select("id, name, email, office_number")
    .eq("status", "active");

  if (!offices || offices.length === 0) {
    return new Response(JSON.stringify({ message: "No active offices" }));
  }

  // Get offices that have already submitted
  const { data: submittedReports } = await supabase
    .from("monthly_reports")
    .select("office_id")
    .eq("report_month", reportMonth)
    .in("status", ["submitted", "invoiced", "paid"]);

  const submittedOfficeIds = new Set(
    (submittedReports ?? []).map((r) => r.office_id)
  );

  const pendingOffices = offices.filter((o) => !submittedOfficeIds.has(o.id));

  let sent = 0;
  for (const office of pendingOffices) {
    try {
      await supabase.from("email_log").insert({
        recipient_email: office.email,
        template: "reminder_final",
        subject: `URGENT: Revenue Report Overdue — ${office.name}`,
        status: "sent",
        metadata: {
          office_id: office.id,
          report_month: reportMonth,
        },
      });
      sent++;
    } catch (err) {
      await supabase.from("email_log").insert({
        recipient_email: office.email,
        template: "reminder_final",
        subject: `URGENT: Revenue Report Overdue — ${office.name}`,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        metadata: {
          office_id: office.id,
          report_month: reportMonth,
        },
      });
    }
  }

  return new Response(
    JSON.stringify({
      message: `Sent ${sent} final reminder emails`,
      pending: pendingOffices.length,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
