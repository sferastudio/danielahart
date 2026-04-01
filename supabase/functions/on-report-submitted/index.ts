import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, adminNotificationEmail } from "../_shared/email.ts";

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

  // Fetch active admin profile IDs
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true);

  const office = report.offices;

  let sent = 0;
  for (const admin of admins ?? []) {
    // Look up actual email from auth.users
    const { data: userData } = await supabase.auth.admin.getUserById(admin.id);
    if (!userData?.user?.email) continue;

    const adminEmail = userData.user.email;
    const { subject, html } = adminNotificationEmail(
      {
        report_month: report.report_month,
        total_gross: Number(report.total_gross),
        total_fees_due: Number(report.total_fees_due),
      },
      {
        name: office?.name ?? "Unknown",
        email: office?.email ?? "",
        office_number: office?.office_number ?? "",
      },
      adminEmail
    );

    try {
      const result = await sendEmail(adminEmail, subject, html);
      await supabase.from("email_log").insert({
        recipient_email: adminEmail,
        template: "admin_notification",
        subject,
        status: "sent",
        metadata: {
          report_id,
          office_name: office?.name,
          total_gross: report.total_gross,
          total_fees_due: report.total_fees_due,
          resend_id: result.id,
        },
      });
      sent++;
    } catch (err) {
      await supabase.from("email_log").insert({
        recipient_email: adminEmail,
        template: "admin_notification",
        subject,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        metadata: {
          report_id,
          office_name: office?.name,
        },
      });
    }
  }

  return new Response(
    JSON.stringify({ message: `Sent ${sent} admin notification emails` }),
    { headers: { "Content-Type": "application/json" } }
  );
});
