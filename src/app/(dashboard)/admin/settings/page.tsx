import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChangePasswordForm } from "@/app/(dashboard)/office/settings/change-password-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title="Settings" subtitle="Admin Portal" />
      <div className="px-4 md:px-10 py-6 md:py-10">
        <div className="max-w-md">
          <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest mb-6">
              Change Password
            </h2>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
