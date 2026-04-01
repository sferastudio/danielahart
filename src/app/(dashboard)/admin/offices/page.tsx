import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { OfficeManager } from "@/components/admin/OfficeManager";

export default async function AdminOfficesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: offices } = await admin
    .from("offices")
    .select("*")
    .order("name");

  return (
    <>
      <PageHeader title="Franchisee Management" subtitle="Admin Portal" />
      <div className="px-4 md:px-10 py-6 md:py-10">
        <OfficeManager offices={offices ?? []} />
      </div>
    </>
  );
}
