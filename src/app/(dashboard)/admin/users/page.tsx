import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserManager } from "@/components/admin/UserManager";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("*, offices(name, office_number, phone, email)")
    .order("created_at", { ascending: false });

  // Fetch auth users to get emails
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const emailMap: Record<string, string> = {};
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      emailMap[u.id] = u.email ?? "";
    }
  }

  const { data: offices } = await admin
    .from("offices")
    .select("id, name, office_number")
    .eq("status", "active")
    .order("name");

  return (
    <>
      <PageHeader title="User Management" subtitle="Admin Portal" />
      <div className="px-10 py-10">
        <UserManager
          profiles={profiles ?? []}
          offices={offices ?? []}
          emailMap={emailMap}
        />
      </div>
    </>
  );
}
