import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, reminderFirstEmail } from "../_shared/email.ts";

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

  // Get offices that have already submitted for this month
  const { data: submittedReports } = await supabase
    .from("monthly_reports")
    .select("office_id")
    .eq("report_month", reportMonth)
    .in("status", ["submitted", "invoiced", "paid"]);

  const submittedOfficeIds = new Set(
    (submittedReports ?? []).map((r: { office_id: string }) => r.office_id)
  );

  // Filter to offices that haven't submitted
  const pendingOffices = offices.filter((o: { id: string }) => !submittedOfficeIds.has(o.id));

  let sent = 0;
  for (const office of pendingOffices) {
    const { subject, html } = reminderFirstEmail({
      name: office.name,
      email: office.email,
      office_number: office.office_number,
    });

    try {
      const result = await sendEmail(office.email, subject, html);
      await supabase.from("email_log").insert({
        recipient_email: office.email,
        template: "reminder_first",
        subject,
        status: "sent",
        metadata: {
          office_id: office.id,
          report_month: reportMonth,
          resend_id: result.id,
        },
      });
      sent++;
    } catch (err) {
      await supabase.from("email_log").insert({
        recipient_email: office.email,
        template: "reminder_first",
        subject,
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
      message: `Sent ${sent} reminder emails`,
      pending: pendingOffices.length,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
