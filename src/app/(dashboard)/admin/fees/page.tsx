import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeeManager } from "@/components/admin/FeeManager";

export default async function AdminFeesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: offices } = await admin
    .from("offices")
    .select("id, name, office_number, royalty_percentage, advertising_percentage, status")
    .order("name");

  // Fetch recent fee change audit entries
  const { data: auditEntries } = await admin
    .from("audit_log")
    .select("*")
    .eq("action", "update_office_fees")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <PageHeader title="Fee Management" subtitle="Admin Portal" />
      <div className="px-10 py-10">
        <FeeManager offices={offices ?? []} auditLog={auditEntries ?? []} />
      </div>
    </>
  );
}
