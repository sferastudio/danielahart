import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminMonthlySalesForm } from "@/components/admin/AdminMonthlySalesForm";

export default async function AdminMonthlySalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: offices } = await admin
    .from("offices")
    .select("id, name, office_number, royalty_percentage, advertising_percentage")
    .eq("status", "active")
    .order("name");

  return (
    <>
      <PageHeader title="Monthly Sales" subtitle="Admin Portal" />
      <div className="px-10 py-10">
        <AdminMonthlySalesForm offices={offices ?? []} />
      </div>
    </>
  );
}
