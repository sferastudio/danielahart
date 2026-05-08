"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOfficeId } from "@/lib/office-context";

interface ReportInput {
  report_month: string;
  tax_preparation_fees: number;
  bookkeeping_fees: number;
  insurance_commissions: number;
  notary_copy_fax_fees: number;
  translation_document_fees: number;
  other_service_fees: number;
}

async function getSubOfficeContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const role = user.user_metadata?.role ?? "sub_office";
  if (role !== "sub_office")
    return { error: "Only sub_office users can manage reports" };

  const office_id = await getActiveOfficeId(user.id);
  if (!office_id) return { error: "No office assigned" };

  return { supabase, user, office_id, role };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const role = user.user_metadata?.role ?? "sub_office";
  if (role !== "admin")
    return { error: "Only admins can perform this action" };

  const admin = createAdminClient();
  return { admin, user };
}

export async function saveDraft(input: ReportInput) {
  const ctx = await getSubOfficeContext();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, office_id } = ctx;

  const reportData = {
    office_id,
    report_month: input.report_month,
    tax_preparation_fees: input.tax_preparation_fees,
    bookkeeping_fees: input.bookkeeping_fees,
    insurance_commissions: input.insurance_commissions,
    notary_copy_fax_fees: input.notary_copy_fax_fees,
    translation_document_fees: input.translation_document_fees,
    other_service_fees: input.other_service_fees,
    status: "draft" as const,
  };

  const { data: report, error } = await supabase
    .from("monthly_reports")
    .upsert(reportData, {
      onConflict: "office_id,report_month",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, report };
}

export async function submitReport(input: ReportInput) {
  const ctx = await getSubOfficeContext();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user, office_id } = ctx;

  const fields = [
    input.tax_preparation_fees,
    input.bookkeeping_fees,
    input.insurance_commissions,
    input.notary_copy_fax_fees,
    input.translation_document_fees,
    input.other_service_fees,
  ];
  if (fields.some((f) => f < 0)) {
    return { success: false, error: "Revenue fields cannot be negative" };
  }

  const totalGross = fields.reduce((sum, f) => sum + f, 0);
  if (totalGross <= 0) {
    return { success: false, error: "Total gross revenue must be greater than zero" };
  }

  const reportData = {
    office_id,
    report_month: input.report_month,
    tax_preparation_fees: input.tax_preparation_fees,
    bookkeeping_fees: input.bookkeeping_fees,
    insurance_commissions: input.insurance_commissions,
    notary_copy_fax_fees: input.notary_copy_fax_fees,
    translation_document_fees: input.translation_document_fees,
    other_service_fees: input.other_service_fees,
    status: "submitted" as const,
    submitted_at: new Date().toISOString(),
    submitted_by: user.id,
  };

  const { data: report, error } = await supabase
    .from("monthly_reports")
    .upsert(reportData, {
      onConflict: "office_id,report_month",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Notify admins via Edge Function (fire-and-forget)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey && report) {
      fetch(`${supabaseUrl}/functions/v1/on-report-submitted`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ report_id: report.id }),
      }).catch((err) => console.error("Admin notification email failed:", err));
    }
  } catch {
    // Non-critical — don't block submission
  }

  return { success: true, report };
}

export async function adminSaveReport(officeId: string, input: ReportInput) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const fields = [
    input.tax_preparation_fees,
    input.bookkeeping_fees,
    input.insurance_commissions,
    input.notary_copy_fax_fees,
    input.translation_document_fees,
    input.other_service_fees,
  ];
  if (fields.some((f) => f < 0)) {
    return { success: false, error: "Revenue fields cannot be negative" };
  }

  const reportData = {
    office_id: officeId,
    report_month: input.report_month,
    tax_preparation_fees: input.tax_preparation_fees,
    bookkeeping_fees: input.bookkeeping_fees,
    insurance_commissions: input.insurance_commissions,
    notary_copy_fax_fees: input.notary_copy_fax_fees,
    translation_document_fees: input.translation_document_fees,
    other_service_fees: input.other_service_fees,
    status: "submitted" as const,
    submitted_at: new Date().toISOString(),
    submitted_by: user.id,
    edited_by: user.id,
    edited_at: new Date().toISOString(),
  };

  const { data: report, error } = await admin
    .from("monthly_reports")
    .upsert(reportData, {
      onConflict: "office_id,report_month",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "admin_save_report",
    entity_type: "monthly_report",
    entity_id: report.id,
    changes: reportData,
  });

  return { success: true, report };
}

export async function toggleProcessed(reportId: string) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin } = ctx;

  const { data: existing } = await admin
    .from("monthly_reports")
    .select("is_processed")
    .eq("id", reportId)
    .single();

  if (!existing) return { success: false, error: "Report not found" };

  const { error } = await admin
    .from("monthly_reports")
    .update({ is_processed: !existing.is_processed })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };

  return { success: true, is_processed: !existing.is_processed };
}

export async function adminUpdateReport(
  reportId: string,
  updates: Partial<ReportInput> & { notes?: string }
) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { data: existing } = await admin
    .from("monthly_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (!existing) return { success: false, error: "Report not found" };

  const updateData: Record<string, unknown> = {
    ...updates,
    edited_by: user.id,
    edited_at: new Date().toISOString(),
  };

  const { data: report, error } = await admin
    .from("monthly_reports")
    .update(updateData)
    .eq("id", reportId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "update_report",
    entity_type: "monthly_report",
    entity_id: reportId,
    changes: {
      before: existing,
      after: report,
    },
  });

  return { success: true, report };
}

export async function sendReminder(officeId: string) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { data: office } = await admin
    .from("offices")
    .select("id, name, email, office_number")
    .eq("id", officeId)
    .single();

  if (!office || !office.email) {
    return { success: false, error: "Office not found or has no email" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-reminder-emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ office_id: officeId }),
      });
    } catch (err) {
      console.error("Reminder email failed:", err);
      return { success: false, error: "Failed to send reminder email" };
    }
  }

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "send_reminder",
    entity_type: "office",
    entity_id: officeId,
  });

  return { success: true };
}

export async function markReviewed(reportId: string) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { error } = await admin
    .from("monthly_reports")
    .update({ is_processed: true })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "mark_reviewed",
    entity_type: "monthly_report",
    entity_id: reportId,
  });

  return { success: true, is_processed: true };
}

export async function markAsInvoiced(reportId: string, qbInvoiceNumber?: string) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { data: existing } = await admin
    .from("monthly_reports")
    .select("id, status, office_id, report_month")
    .eq("id", reportId)
    .single();

  if (!existing) return { success: false, error: "Report not found" };
  if (existing.status !== "submitted")
    return {
      success: false,
      error: `Cannot mark as invoiced — report is in ${existing.status} status`,
    };

  const trimmed = qbInvoiceNumber?.trim();
  const { error } = await admin
    .from("monthly_reports")
    .update({
      status: "invoiced",
      invoiced_at: new Date().toISOString(),
      qb_invoice_number: trimmed && trimmed.length > 0 ? trimmed : null,
    })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "mark_invoiced",
    entity_type: "monthly_report",
    entity_id: reportId,
    changes: {
      qb_invoice_number: trimmed && trimmed.length > 0 ? trimmed : null,
    },
  });

  // Send courtesy email to franchisee (fire-and-forget)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      fetch(`${supabaseUrl}/functions/v1/on-report-invoiced`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: reportId,
          qb_invoice_number: trimmed && trimmed.length > 0 ? trimmed : null,
        }),
      }).catch((err) => console.error("Invoiced email failed:", err));
    }
  } catch {
    // Non-critical
  }

  return { success: true };
}

export async function markAsPaid(reportId: string) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { data: existing } = await admin
    .from("monthly_reports")
    .select("id, status")
    .eq("id", reportId)
    .single();

  if (!existing) return { success: false, error: "Report not found" };
  if (existing.status === "paid") return { success: false, error: "Report is already paid" };

  const { error } = await admin
    .from("monthly_reports")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "mark_paid_manually",
    entity_type: "monthly_report",
    entity_id: reportId,
  });

  return { success: true };
}
