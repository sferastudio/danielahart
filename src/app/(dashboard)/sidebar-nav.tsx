"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, Building2, Users, Percent, DollarSign, Megaphone } from "lucide-react";

const ICONS = {
  grid: LayoutDashboard,
  file: FileText,
  settings: Settings,
  building: Building2,
  users: Users,
  percent: Percent,
  dollar: DollarSign,
  megaphone: Megaphone,
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

interface SidebarNavProps {
  items: NavItem[];
  onNavigate?: () => void;
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[4px] transition-all border-l-4 ${
              isActive
                ? "bg-[#F1F5F9] border-navy-900 text-navy-900 font-bold"
                : "border-transparent text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-sm tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
