import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeeHistoryManager } from "@/components/admin/FeeHistoryManager";

export default async function ManageAdvertisingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: offices } = await admin
    .from("offices")
    .select("id, name, office_number, royalty_percentage, advertising_percentage")
    .order("name");

  return (
    <>
      <PageHeader title="Manage Advertising %" subtitle="Admin Portal" />
      <div className="px-10 py-10">
        <FeeHistoryManager offices={offices ?? []} feeType="advertising" />
      </div>
    </>
  );
}
