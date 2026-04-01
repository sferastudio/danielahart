import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role ?? "sub_office";

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

  const navItems = role === "admin"
    ? [
        { href: "/admin/dashboard", label: "Dashboard", icon: "grid" as const },
        { href: "/admin/monthly-sales", label: "Monthly Sales", icon: "dollar" as const },
        { href: "/admin/reports", label: "Sales Reports", icon: "file" as const },
        { href: "/admin/offices", label: "Franchisees", icon: "building" as const },
        { href: "/admin/users", label: "Users", icon: "users" as const },
        { href: "/admin/fees/royalty", label: "Manage Royalty %", icon: "percent" as const },
        { href: "/admin/fees/advertising", label: "Manage Advertising %", icon: "megaphone" as const },
        { href: "/admin/settings", label: "Settings", icon: "settings" as const },
      ]
    : [
        { href: "/office/dashboard", label: "Dashboard", icon: "grid" as const },
        { href: "/office/past-reports", label: "Past Reports", icon: "file" as const },
        { href: "/office/settings", label: "Account Settings", icon: "settings" as const },
      ];

  const userLabel = officeName || profile?.full_name || user.email || "";

  return (
    <DashboardShell navItems={navItems} userLabel={userLabel}>
      {children}
    </DashboardShell>
  );
}
