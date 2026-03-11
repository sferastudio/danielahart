import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";
import { Footer } from "@/components/layout/Footer";

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

  // Read role from user_metadata (set by seed script) — JWT custom claims
  // are only available in the session token, not on the getUser() result.
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

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-navy-900">
      {/* Sidebar — white with right border */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
        {/* Logo */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <Image
            src="/logo.png"
            alt="Daniel Ahart Tax"
            width={160}
            height={40}
            priority
            className="h-10 w-auto object-contain"
          />
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Platform Online
            </span>
          </div>
        </div>

        {/* Navigation */}
        <SidebarNav items={navItems} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* User card + Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-[4px] p-3 mb-4 border border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              Authenticated As
            </p>
            <p className="font-bold text-xs truncate uppercase tracking-tighter">
              {officeName || profile?.full_name || user.email}
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
