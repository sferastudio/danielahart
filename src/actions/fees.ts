"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const role =
    user.user_metadata?.role ?? "sub_office";
  if (role !== "admin") return { error: "Admin access required" };

  // Use admin client for data operations (bypasses RLS)
  const admin = createAdminClient();
  return { admin, user };
}

interface FeeRateRow {
  id?: string;
  percentage: number;
  start_month: string;
  end_month: string | null;
}

export async function saveFeeHistory(
  officeId: string,
  feeType: "royalty" | "advertising",
  rows: FeeRateRow[]
) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  // Delete existing rows for this office+feeType, then insert new ones
  const { error: deleteError } = await admin
    .from("fee_rate_history")
    .delete()
    .eq("office_id", officeId)
    .eq("fee_type", feeType);

  if (deleteError) return { success: false, error: deleteError.message };

  if (rows.length > 0) {
    const insertData = rows.map((row) => ({
      office_id: officeId,
      fee_type: feeType,
      percentage: row.percentage,
      start_month: row.start_month,
      end_month: row.end_month,
    }));

    const { error: insertError } = await admin
      .from("fee_rate_history")
      .insert(insertData);

    if (insertError) return { success: false, error: insertError.message };
  }

  // Update the current rate on the office (use the ongoing row's percentage)
  const ongoingRow = rows.find((r) => !r.end_month);
  if (ongoingRow) {
    const updateField =
      feeType === "royalty" ? "royalty_percentage" : "advertising_percentage";
    await admin
      .from("offices")
      .update({ [updateField]: ongoingRow.percentage })
      .eq("id", officeId);
  }

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: `update_${feeType}_history`,
    entity_type: "fee_rate_history",
    entity_id: officeId,
    changes: { fee_type: feeType, rows },
  });

  return { success: true };
}

export async function getFeeHistory(
  officeId: string,
  feeType: "royalty" | "advertising"
) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error, data: [] };
  const { admin } = ctx;

  const { data, error } = await admin
    .from("fee_rate_history")
    .select("*")
    .eq("office_id", officeId)
    .eq("fee_type", feeType)
    .order("start_month", { ascending: true });

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data ?? [] };
}

export async function updateOfficeFees(
  officeId: string,
  royaltyPercentage: number,
  advertisingPercentage: number
) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { data: existing } = await admin
    .from("offices")
    .select("royalty_percentage, advertising_percentage")
    .eq("id", officeId)
    .single();

  if (!existing) return { success: false, error: "Franchisee not found" };

  const { data: office, error } = await admin
    .from("offices")
    .update({
      royalty_percentage: royaltyPercentage,
      advertising_percentage: advertisingPercentage,
    })
    .eq("id", officeId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "update_office_fees",
    entity_type: "office",
    entity_id: officeId,
    changes: {
      before: {
        royalty_percentage: existing.royalty_percentage,
        advertising_percentage: existing.advertising_percentage,
      },
      after: {
        royalty_percentage: royaltyPercentage,
        advertising_percentage: advertisingPercentage,
      },
    },
  });

  return { success: true, office };
}
