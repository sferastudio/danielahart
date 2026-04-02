"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SidebarNav, type NavItem } from "@/app/(dashboard)/sidebar-nav";
import { LogoutButton } from "@/app/(dashboard)/logout-button";
import { Footer } from "@/components/layout/Footer";

interface DashboardShellProps {
  navItems: NavItem[];
  userLabel: string;
  children: React.ReactNode;
}

export function DashboardShell({ navItems, userLabel, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-navy-900">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col z-20">
        <SidebarContent navItems={navItems} userLabel={userLabel} />
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white z-40 flex flex-col transform transition-transform duration-200 ease-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-5 right-4 p-1 text-slate-400 hover:text-slate-600"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        <SidebarContent
          navItems={navItems}
          userLabel={userLabel}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar — hidden on desktop */}
        <div className="flex md:hidden items-center justify-between h-14 px-4 bg-white border-b border-slate-200">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 text-slate-600 hover:text-navy-900"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Image
            src="/logo.png"
            alt="Daniel Ahart Tax"
            width={120}
            height={30}
            className="h-7 object-contain"
            style={{ width: "auto" }}
          />
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        <main className="flex-1 overflow-y-auto flex flex-col">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navItems,
  userLabel,
  onNavigate,
}: {
  navItems: NavItem[];
  userLabel: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-8 border-b border-slate-100 bg-white">
        <Image
          src="/logo.png"
          alt="Daniel Ahart Tax"
          width={160}
          height={40}
          priority
          className="h-10 object-contain"
          style={{ width: "auto" }}
        />
        <div className="mt-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Platform Online
          </span>
        </div>
      </div>

      {/* Navigation */}
      <SidebarNav items={navItems} onNavigate={onNavigate} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* User card + Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-[4px] p-3 mb-4 border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
            Authenticated As
          </p>
          <p className="font-bold text-xs truncate uppercase tracking-tighter">
            {userLabel}
          </p>
        </div>
        <LogoutButton />
      </div>
    </>
  );
}
