"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OfficeStatus } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const role = user.user_metadata?.role ?? "sub_office";
  if (role !== "admin") return { error: "Admin access required" };

  const admin = createAdminClient();
  return { admin, user };
}

interface CreateOfficeInput {
  name: string;
  office_number: string;
  email: string;
  address?: string;
  phone?: string;
  royalty_percentage: number;
  advertising_percentage: number;
  status?: OfficeStatus;
}

export async function createOffice(input: CreateOfficeInput) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const name = input.name?.trim();
  const office_number = input.office_number?.trim();
  const email = input.email?.trim();

  if (!name) return { success: false, error: "Office name is required" };
  if (!office_number) return { success: false, error: "Office number is required" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { success: false, error: "A valid email address is required" };
  if (input.royalty_percentage < 0 || input.royalty_percentage > 1)
    return { success: false, error: "Royalty percentage must be between 0 and 1" };
  if (input.advertising_percentage < 0 || input.advertising_percentage > 1)
    return { success: false, error: "Advertising percentage must be between 0 and 1" };

  const { data: office, error } = await admin
    .from("offices")
    .insert({
      name: name,
      office_number: office_number,
      email: email,
      address: input.address || null,
      phone: input.phone || null,
      royalty_percentage: input.royalty_percentage,
      advertising_percentage: input.advertising_percentage,
      status: input.status || "active",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "create_office",
    entity_type: "office",
    entity_id: office.id,
    changes: { created: office },
  });

  return { success: true, office };
}

interface UpdateOfficeInput {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
  royalty_percentage?: number;
  advertising_percentage?: number;
  status?: OfficeStatus;
}

export async function updateOffice(officeId: string, input: UpdateOfficeInput) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  if (input.email !== undefined) {
    const email = input.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { success: false, error: "A valid email address is required" };
  }
  if (input.royalty_percentage !== undefined && (input.royalty_percentage < 0 || input.royalty_percentage > 1))
    return { success: false, error: "Royalty percentage must be between 0 and 1" };
  if (input.advertising_percentage !== undefined && (input.advertising_percentage < 0 || input.advertising_percentage > 1))
    return { success: false, error: "Advertising percentage must be between 0 and 1" };

  const { data: existing } = await admin
    .from("offices")
    .select("*")
    .eq("id", officeId)
    .single();

  if (!existing) return { success: false, error: "Franchisee not found" };

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.address !== undefined) updateData.address = input.address || null;
  if (input.phone !== undefined) updateData.phone = input.phone || null;
  if (input.royalty_percentage !== undefined)
    updateData.royalty_percentage = input.royalty_percentage;
  if (input.advertising_percentage !== undefined)
    updateData.advertising_percentage = input.advertising_percentage;
  if (input.status !== undefined) {
    updateData.status = input.status;
    updateData.is_active = input.status === "active";
  }

  const { data: office, error } = await admin
    .from("offices")
    .update(updateData)
    .eq("id", officeId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "update_office",
    entity_type: "office",
    entity_id: officeId,
    changes: { before: existing, after: office },
  });

  return { success: true, office };
}

export async function deactivateOffice(officeId: string) {
  return updateOffice(officeId, { status: "terminated" });
}
