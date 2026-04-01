import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { STYLES } from "@/lib/constants";
import { ChangePasswordForm } from "./change-password-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, office_id")
    .eq("id", user.id)
    .single();

  let officeName = "";
  if (profile?.office_id) {
    const { data: office } = await supabase
      .from("offices")
      .select("name")
      .eq("id", profile.office_id)
      .single();
    officeName = office?.name ?? "";
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ACCOUNT SETTINGS" subtitle="FRANCHISEE PORTAL" />

      {/* User Info */}
      <div className="rounded-lg bg-white p-4 md:p-6 shadow-sm">
        <p className={`${STYLES.sectionHeader} mb-4`}>ACCOUNT INFORMATION</p>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile?.full_name}</span>
          </div>
          {officeName && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Franchisee</span>
              <span className="font-medium">{officeName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-lg bg-white p-4 md:p-6 shadow-sm">
        <p className={`${STYLES.sectionHeader} mb-4`}>CHANGE PASSWORD</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
