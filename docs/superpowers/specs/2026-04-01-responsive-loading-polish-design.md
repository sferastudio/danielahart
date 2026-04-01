# Responsive Layout, Loading States & Polish

## Context

The franchise portal's core features are complete but the UI lacks mobile responsiveness (sidebar is fixed 256px with no mobile adaptation), has no loading indicators during page transitions, and server-side validation has gaps in some actions. This spec covers three improvements: mobile-responsive sidebar, skeleton loading states, and validation/error hardening.

---

## 1. Responsive Sidebar — Slide-out Drawer

### Behavior

- **Desktop (`md:` and up, ≥768px):** No change. Fixed 256px sidebar on the left.
- **Mobile (`< md`, <768px):** Sidebar hidden by default. A top bar with hamburger icon and logo replaces it. Tapping the hamburger slides the sidebar in from the left as an overlay drawer. A dimmed backdrop covers the main content. Tapping the backdrop or an X button closes the drawer. Navigating to a new page also closes the drawer.

### Files to modify

- **`src/app/(dashboard)/layout.tsx`** — Add mobile top bar (`md:hidden`) with hamburger toggle. Wrap sidebar in a drawer component that is `hidden md:flex` on desktop and conditionally visible on mobile. Add backdrop overlay.
- **`src/app/(dashboard)/sidebar-nav.tsx`** — Accept an `onNavigate` callback prop. Call it when a nav link is clicked so the parent can close the drawer on mobile.
- Extract the layout into a **new client component** `src/components/layout/DashboardShell.tsx` since the drawer toggle requires client-side state (`useState` for open/closed). The server layout renders `DashboardShell` and passes nav items + user info as props.

### Transition

- Sidebar slides in with `transform translateX(-100%) → translateX(0)` over 200ms ease-out.
- Backdrop fades in from `opacity-0` to `opacity-50` (black).
- Use Tailwind classes + `transition-transform duration-200`.

### Breakpoint

- `md` (768px) — matches the auth layout's existing responsive breakpoint.

---

## 2. Skeleton Loading States

### Approach

Add `loading.tsx` files for each dashboard route group. Each skeleton mimics the page layout using `animate-pulse` gray placeholder blocks.

### Files to create

| Route | Skeleton content |
|-------|-----------------|
| `src/app/(dashboard)/admin/dashboard/loading.tsx` | 4 KPI cards + table placeholder |
| `src/app/(dashboard)/admin/monthly-sales/loading.tsx` | Dropdown + 6 form field placeholders + summary section |
| `src/app/(dashboard)/admin/reports/loading.tsx` | Filter bar + table placeholder |
| `src/app/(dashboard)/admin/offices/loading.tsx` | Table placeholder |
| `src/app/(dashboard)/admin/offices/[officeId]/loading.tsx` | Header + detail card + table |
| `src/app/(dashboard)/admin/users/loading.tsx` | Table placeholder |
| `src/app/(dashboard)/admin/fees/royalty/loading.tsx` | Dropdown + table placeholder |
| `src/app/(dashboard)/admin/fees/advertising/loading.tsx` | Dropdown + table placeholder |
| `src/app/(dashboard)/office/dashboard/loading.tsx` | Form fields + summary + status timeline |
| `src/app/(dashboard)/office/past-reports/loading.tsx` | Table placeholder |

### Skeleton component

Create a reusable `src/components/ui/skeleton.tsx` utility:
```tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-slate-200", className)} />;
}
```

Then each `loading.tsx` composes `Skeleton` blocks matching the page layout (e.g., `<Skeleton className="h-24 w-full" />` for a KPI card).

---

## 3. Server-Side Validation Hardening

### Current state

- `reports.ts` — has basic checks (negative values, total > 0)
- `offices.ts` — no input validation
- `users.ts` — no email/password validation
- `fees.ts` — no validation

### Changes

Tighten inline validation in each server action. No Zod — keep the existing pattern of early-return `{ success: false, error: "..." }`.

**`src/actions/offices.ts`:**
- Require `name` and `office_number` to be non-empty strings
- Require `email` to be a valid email format (simple regex)
- Reject duplicate `office_number` (query before insert)

**`src/actions/users.ts`:**
- Require `email` to be valid format
- Require `password` to be at least 8 characters
- Require `full_name` to be non-empty
- Require `role` to be `"admin"` or `"sub_office"`

**`src/actions/fees.ts`:**
- Require `percentage` to be between 0 and 1 (0-100%)
- Require `start_month` to be a valid date
- Require `end_month` > `start_month` when both are set

---

## 4. Error Boundaries

### Files to create

- **`src/app/(dashboard)/error.tsx`** — Catches unhandled errors in dashboard routes. Shows a branded error card with "Something went wrong" message and a "Try again" button that calls `reset()`.
- **`src/app/(dashboard)/not-found.tsx`** — Shows "Page not found" with a link back to dashboard.
- **`src/app/global-error.tsx`** — Root-level fallback for catastrophic errors.

---

## Verification

1. **Responsive:** Resize browser below 768px → hamburger appears, sidebar hidden. Tap hamburger → drawer slides in. Navigate → drawer closes. Desktop unchanged.
2. **Loading:** Navigate between admin pages → skeleton appears briefly before content loads.
3. **Validation:** Submit office with empty name → toast error. Create user with 3-char password → toast error. Save fee with percentage > 1 → toast error.
4. **Errors:** Visit `/admin/nonexistent` → not-found page. Force an error in a page → error boundary catches it with retry button.
