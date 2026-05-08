import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, reportInvoicedEmail } from "../_shared/email.ts";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { report_id, qb_invoice_number } = await req.json();

  if (!report_id) {
    return new Response(
      JSON.stringify({ error: "report_id required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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

  const office = report.offices;
  if (!office?.email) {
    return new Response(
      JSON.stringify({ error: "Office has no email on file" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { subject, html } = reportInvoicedEmail(
    {
      report_month: report.report_month,
      total_fees_due: Number(report.total_fees_due),
    },
    {
      name: office.name ?? "",
      email: office.email,
      office_number: office.office_number ?? "",
    },
    qb_invoice_number ?? null
  );

  try {
    const result = await sendEmail(office.email, subject, html);
    await supabase.from("email_log").insert({
      recipient_email: office.email,
      template: "report_invoiced",
      subject,
      status: "sent",
      metadata: {
        report_id,
        office_name: office.name,
        qb_invoice_number: qb_invoice_number ?? null,
        resend_id: result.id,
      },
    });
    return new Response(
      JSON.stringify({ message: "Invoiced email sent" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    await supabase.from("email_log").insert({
      recipient_email: office.email,
      template: "report_invoiced",
      subject,
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown error",
      metadata: {
        report_id,
        office_name: office.name,
        qb_invoice_number: qb_invoice_number ?? null,
      },
    });
    return new Response(
      JSON.stringify({ error: "Failed to send invoiced email" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
