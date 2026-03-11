"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

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

interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  office_id?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_active?: boolean;
}

export async function createUser(input: CreateUserInput) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.full_name,
        role: input.role,
        office_id: input.office_id || null,
      },
    });

  if (authError) return { success: false, error: authError.message };

  // Update profile with contact fields
  if (input.contact_first_name || input.contact_last_name) {
    await admin
      .from("profiles")
      .update({
        contact_first_name: input.contact_first_name || null,
        contact_last_name: input.contact_last_name || null,
      })
      .eq("id", authData.user.id);
  }

  // Update office address fields if office is assigned
  if (input.office_id) {
    const officeUpdates: Record<string, string | null> = {};
    if (input.phone !== undefined) officeUpdates.phone = input.phone || null;
    if (input.fax !== undefined) officeUpdates.fax = input.fax || null;
    if (input.address !== undefined) officeUpdates.address = input.address || null;
    if (input.city !== undefined) officeUpdates.city = input.city || null;
    if (input.state !== undefined) officeUpdates.state = input.state || null;
    if (input.zip !== undefined) officeUpdates.zip = input.zip || null;

    if (Object.keys(officeUpdates).length > 0) {
      await admin
        .from("offices")
        .update(officeUpdates)
        .eq("id", input.office_id);
    }
  }

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "create_user",
    entity_type: "profile",
    entity_id: authData.user.id,
    changes: {
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      office_id: input.office_id,
    },
  });

  return { success: true, userId: authData.user.id };
}

export async function updateUserStatus(profileId: string, isActive: boolean) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: isActive ? "reactivate_user" : "suspend_user",
    entity_type: "profile",
    entity_id: profileId,
    changes: { is_active: isActive },
  });

  return { success: true };
}

export async function deleteUser(profileId: string) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { admin, user } = ctx;

  const { error } = await admin.auth.admin.deleteUser(profileId);

  if (error) return { success: false, error: error.message };

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "delete_user",
    entity_type: "profile",
    entity_id: profileId,
    changes: { deleted: true },
  });

  return { success: true };
}
