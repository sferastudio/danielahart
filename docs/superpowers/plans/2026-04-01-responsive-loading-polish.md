# Responsive Layout, Loading States & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the franchise portal mobile-friendly, add skeleton loading states, harden server-side validation, and add error boundaries.

**Architecture:** Extract dashboard layout into a client-side `DashboardShell` component with drawer state for mobile sidebar. Add `loading.tsx` Suspense boundaries per route. Add inline validation to server actions. Add `error.tsx` and `not-found.tsx` boundaries.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, lucide-react, existing shadcn/ui components.

---

### Task 1: Create Skeleton UI Component

**Files:**
- Create: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Create the Skeleton component**

```tsx
// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-slate-200", className)} />;
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/skeleton.tsx
git commit -m "feat: add reusable Skeleton loading component"
```

---

### Task 2: Create DashboardShell Client Component (Mobile Drawer)

**Files:**
- Create: `src/components/layout/DashboardShell.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/(dashboard)/sidebar-nav.tsx`

- [ ] **Step 1: Add `onNavigate` prop to SidebarNav**

Modify `src/app/(dashboard)/sidebar-nav.tsx` — add an optional `onNavigate` callback that fires when a link is clicked:

```tsx
// src/app/(dashboard)/sidebar-nav.tsx
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
```

- [ ] **Step 2: Create DashboardShell component**

```tsx
// src/components/layout/DashboardShell.tsx
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
            className="h-7 w-auto object-contain"
          />
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">{children}</div>
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
```

- [ ] **Step 3: Update dashboard layout to use DashboardShell**

Replace the full content of `src/app/(dashboard)/layout.tsx` with:

```tsx
// src/app/(dashboard)/layout.tsx
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
```

- [ ] **Step 4: Verify it builds**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/DashboardShell.tsx src/app/(dashboard)/layout.tsx src/app/(dashboard)/sidebar-nav.tsx
git commit -m "feat: add responsive mobile sidebar with slide-out drawer"
```

---

### Task 3: Add Skeleton Loading Pages

**Files:**
- Create: `src/app/(dashboard)/admin/dashboard/loading.tsx`
- Create: `src/app/(dashboard)/admin/monthly-sales/loading.tsx`
- Create: `src/app/(dashboard)/admin/reports/loading.tsx`
- Create: `src/app/(dashboard)/admin/offices/loading.tsx`
- Create: `src/app/(dashboard)/admin/offices/[officeId]/loading.tsx`
- Create: `src/app/(dashboard)/admin/users/loading.tsx`
- Create: `src/app/(dashboard)/admin/fees/royalty/loading.tsx`
- Create: `src/app/(dashboard)/admin/fees/advertising/loading.tsx`
- Create: `src/app/(dashboard)/office/dashboard/loading.tsx`
- Create: `src/app/(dashboard)/office/past-reports/loading.tsx`
- Create: `src/app/(dashboard)/admin/settings/loading.tsx`
- Create: `src/app/(dashboard)/office/settings/loading.tsx`

- [ ] **Step 1: Create admin dashboard loading skeleton**

```tsx
// src/app/(dashboard)/admin/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      {/* Page header skeleton */}
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-8 w-40" />
      </header>

      <div className="p-10 space-y-8">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[4px] border border-slate-200 p-6">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Table placeholder */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create table-style loading skeleton (reused by reports, offices, users, fees)**

```tsx
// src/app/(dashboard)/admin/reports/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-10 space-y-6">
        {/* Filter bar */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6 flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create remaining admin loading skeletons**

Create the following files, each using the same table skeleton pattern from Step 2 (copy the exact content from Step 2):
- `src/app/(dashboard)/admin/offices/loading.tsx`
- `src/app/(dashboard)/admin/users/loading.tsx`
- `src/app/(dashboard)/admin/fees/royalty/loading.tsx`
- `src/app/(dashboard)/admin/fees/advertising/loading.tsx`
- `src/app/(dashboard)/admin/settings/loading.tsx`

- [ ] **Step 4: Create admin office detail loading skeleton**

```tsx
// src/app/(dashboard)/admin/offices/[officeId]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-10 space-y-6">
        {/* Detail card */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6 grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>

        {/* Reports table */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <Skeleton className="h-5 w-32 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create admin monthly-sales loading skeleton**

```tsx
// src/app/(dashboard)/admin/monthly-sales/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-10 space-y-6">
        {/* Office selector + month nav */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6 flex items-center gap-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-10" />
        </div>

        {/* Form fields */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* Summary section */}
        <div className="bg-[#0F2B46] rounded-[4px] p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Create office dashboard loading skeleton**

```tsx
// src/app/(dashboard)/office/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-8 w-32" />
      </header>

      <div className="p-10 space-y-6">
        {/* Form fields */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-[#0F2B46] rounded-[4px] p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-white/10" />
            ))}
          </div>
        </div>

        {/* Submission status timeline */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 7: Create office past-reports and settings loading skeletons**

```tsx
// src/app/(dashboard)/office/past-reports/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-10">
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

```tsx
// src/app/(dashboard)/office/settings/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-10">
        <div className="bg-white rounded-[4px] border border-slate-200 p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 mt-4" />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 8: Verify it builds**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add src/app/(dashboard)/admin/dashboard/loading.tsx \
  src/app/(dashboard)/admin/monthly-sales/loading.tsx \
  src/app/(dashboard)/admin/reports/loading.tsx \
  src/app/(dashboard)/admin/offices/loading.tsx \
  src/app/(dashboard)/admin/offices/\[officeId\]/loading.tsx \
  src/app/(dashboard)/admin/users/loading.tsx \
  src/app/(dashboard)/admin/fees/royalty/loading.tsx \
  src/app/(dashboard)/admin/fees/advertising/loading.tsx \
  src/app/(dashboard)/admin/settings/loading.tsx \
  src/app/(dashboard)/office/dashboard/loading.tsx \
  src/app/(dashboard)/office/past-reports/loading.tsx \
  src/app/(dashboard)/office/settings/loading.tsx
git commit -m "feat: add skeleton loading states for all dashboard routes"
```

---

### Task 4: Add Error Boundaries

**Files:**
- Create: `src/app/(dashboard)/error.tsx`
- Create: `src/app/(dashboard)/not-found.tsx`
- Create: `src/app/global-error.tsx`

- [ ] **Step 1: Create dashboard error boundary**

```tsx
// src/app/(dashboard)/error.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-[4px] border border-slate-200 p-10 text-center max-w-md">
        <AlertTriangle className="mx-auto mb-4 text-brand-red" size={40} />
        <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create dashboard not-found page**

```tsx
// src/app/(dashboard)/not-found.tsx
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-[4px] border border-slate-200 p-10 text-center max-w-md">
        <FileQuestion className="mx-auto mb-4 text-slate-400" size={40} />
        <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/admin/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create global error boundary**

```tsx
// src/app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-[#F8FAFC] font-sans">
        <div className="bg-white rounded p-10 text-center max-w-md border border-slate-200">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-6">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#E31B23] text-white font-bold text-sm uppercase rounded hover:bg-[#B91C1C] transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify it builds**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/error.tsx src/app/(dashboard)/not-found.tsx src/app/global-error.tsx
git commit -m "feat: add error boundaries and not-found page for dashboard"
```

---

### Task 5: Harden Server-Side Validation

**Files:**
- Modify: `src/actions/offices.ts`
- Modify: `src/actions/users.ts`
- Modify: `src/actions/fees.ts`

- [ ] **Step 1: Add validation to createOffice and updateOffice**

Add validation at the top of `createOffice` in `src/actions/offices.ts`, after the `requireAdmin()` check:

```typescript
// Add after: const { admin, user } = ctx;

const name = input.name?.trim();
const office_number = input.office_number?.trim();
const email = input.email?.trim();

if (!name) return { success: false, error: "Office name is required" };
if (!office_number) return { success: false, error: "Office number is required" };
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  return { success: false, error: "A valid email address is required" };
if (input.royalty_percentage < 0 || input.royalty_percentage > 1)
  return { success: false, error: "Royalty percentage must be between 0 and 1" };
if (input.advertising_percentage < 0 || input.advertising_percentage > 1)
  return { success: false, error: "Advertising percentage must be between 0 and 1" };
```

Then use `name`, `office_number`, `email` (the trimmed values) in the insert call instead of `input.name`, `input.office_number`, `input.email`.

Add email validation to `updateOffice` — after the `requireAdmin()` check, before building `updateData`:

```typescript
if (input.email !== undefined) {
  const email = input.email.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { success: false, error: "A valid email address is required" };
}
if (input.royalty_percentage !== undefined && (input.royalty_percentage < 0 || input.royalty_percentage > 1))
  return { success: false, error: "Royalty percentage must be between 0 and 1" };
if (input.advertising_percentage !== undefined && (input.advertising_percentage < 0 || input.advertising_percentage > 1))
  return { success: false, error: "Advertising percentage must be between 0 and 1" };
```

- [ ] **Step 2: Add validation to createUser**

Add after the `requireAdmin()` check in `src/actions/users.ts`:

```typescript
const email = input.email?.trim();
const full_name = input.full_name?.trim();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  return { success: false, error: "A valid email address is required" };
if (!input.password || input.password.length < 8)
  return { success: false, error: "Password must be at least 8 characters" };
if (!full_name)
  return { success: false, error: "Full name is required" };
if (input.role !== "admin" && input.role !== "sub_office")
  return { success: false, error: "Role must be admin or sub_office" };
```

Then use `email` and `full_name` (trimmed) in the `createUser` call.

- [ ] **Step 3: Add validation to saveFeeHistory**

Add after the `requireAdmin()` check in `src/actions/fees.ts`:

```typescript
if (feeType !== "royalty" && feeType !== "advertising")
  return { success: false, error: "Fee type must be royalty or advertising" };

for (const row of rows) {
  if (row.percentage < 0 || row.percentage > 1)
    return { success: false, error: "Fee percentage must be between 0 and 1" };
  if (!row.start_month)
    return { success: false, error: "Start month is required for each fee period" };
  if (row.end_month && row.end_month <= row.start_month)
    return { success: false, error: "End month must be after start month" };
}
```

Add to `updateOfficeFees` after `requireAdmin()`:

```typescript
if (royaltyPercentage < 0 || royaltyPercentage > 1)
  return { success: false, error: "Royalty percentage must be between 0 and 1" };
if (advertisingPercentage < 0 || advertisingPercentage > 1)
  return { success: false, error: "Advertising percentage must be between 0 and 1" };
```

- [ ] **Step 4: Verify it builds**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/actions/offices.ts src/actions/users.ts src/actions/fees.ts
git commit -m "fix: add input validation to office, user, and fee server actions"
```

---

### Task 6: Make PageHeader Responsive

**Files:**
- Modify: `src/components/layout/PageHeader.tsx`

- [ ] **Step 1: Add responsive padding and layout to PageHeader**

The PageHeader uses fixed `px-10` which is too wide on mobile. Update it:

Replace the opening `<header>` tag in `src/components/layout/PageHeader.tsx`:

Old:
```tsx
<header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
```

New:
```tsx
<header className="bg-white h-16 md:h-20 border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 shadow-sm">
```

Also hide period info on very small screens to prevent overflow. Wrap the right-side `<div>` with a responsive class:

Old:
```tsx
<div className="flex items-center gap-6">
```

New:
```tsx
<div className="hidden sm:flex items-center gap-6">
```

- [ ] **Step 2: Verify it builds**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/PageHeader.tsx
git commit -m "fix: make PageHeader responsive with mobile-friendly padding"
```
