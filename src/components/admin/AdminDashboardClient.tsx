"use client";

import { useRouter } from "next/navigation";
import { useCurrentPeriod } from "@/hooks/useCurrentPeriod";
import { OfficeWithReport, DashboardStats, AuditLogEntry } from "@/lib/types";
import { CURRENCY_FORMATTER } from "@/lib/constants";
import { OfficeStatusTable } from "@/components/admin/OfficeStatusTable";
import KpiCard from "@/components/admin/KpiCard";
import AlertsSidebar from "@/components/admin/AlertsSidebar";
import ActivityFeed from "@/components/admin/ActivityFeed";
import DeadlineCountdown from "@/components/admin/DeadlineCountdown";
import { Toaster } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

interface AdminDashboardClientProps {
  offices: OfficeWithReport[];
  stats: DashboardStats;
  auditLog: AuditLogEntry[];
  reportMonth: string;
  availableMonths: string[];
}

export function AdminDashboardClient({
  offices,
  stats,
  auditLog,
  reportMonth,
  availableMonths,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const period = useCurrentPeriod();

  const currentIdx = availableMonths.indexOf(reportMonth);
  const hasPrev = currentIdx < availableMonths.length - 1;
  const hasNext = currentIdx > 0;

  const navigateMonth = (month: string) => {
    router.push(`/admin/dashboard?month=${month}`);
  };

  const activeOffices = offices.filter((o) => o.status === "active");
  const submittedCount = activeOffices.filter(
    (o) =>
      o.currentReport &&
      ["submitted", "invoiced", "paid"].includes(o.currentReport.status)
  ).length;

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="px-4 md:px-10 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => hasPrev && navigateMonth(availableMonths[currentIdx + 1])}
              disabled={!hasPrev}
              className="inline-flex items-center justify-center size-8 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            <select
              value={reportMonth}
              onChange={(e) => navigateMonth(e.target.value)}
              className="border border-slate-200 rounded-[4px] px-3 py-1.5 text-sm font-semibold bg-white"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
            <button
              onClick={() => hasNext && navigateMonth(availableMonths[currentIdx - 1])}
              disabled={!hasNext}
              className="inline-flex items-center justify-center size-8 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          {reportMonth !== availableMonths[0] && (
            <button
              onClick={() => navigateMonth(availableMonths[0])}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Jump to latest
            </button>
          )}
        </div>

        {/* KPI Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <KpiCard
            title="Submissions"
            value={`${Math.round(stats.submissionRate * 100)}%`}
            progress={stats.submissionRate}
            progressLabel={`${submittedCount} of ${stats.activeOffices} franchisees`}
          />
          <KpiCard
            title="Gross Revenue"
            value={CURRENCY_FORMATTER.format(stats.totalGrossRevenue)}
            change={stats.revenueChange}
          />
          <KpiCard
            title="Fees Collected"
            value={CURRENCY_FORMATTER.format(stats.feesCollected)}
            subtitle={`${CURRENCY_FORMATTER.format(stats.feesOutstanding)} outstanding`}
          />
          <KpiCard
            title="Overdue"
            value={String(stats.overdueReports)}
            alert={stats.overdueReports > 0}
            subtitle={stats.overdueReports > 0 ? "Require attention" : "None"}
          />
          <KpiCard
            title="Active Franchisees"
            value={String(stats.activeOffices)}
          />
          <KpiCard
            title="Deadline"
            value={
              period.is_overdue
                ? "OVERDUE"
                : `${period.days_remaining} days`
            }
            subtitle={period.formatted_deadline}
            alert={period.is_overdue}
          />
        </div>

        {/* Main Content: Table + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Franchisee Status Table */}
          <div className="lg:col-span-8">
            <OfficeStatusTable offices={offices} periodLabel={formatMonthLabel(reportMonth)} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <AlertsSidebar offices={offices} />
            <ActivityFeed entries={auditLog} />
            <DeadlineCountdown
              submittedCount={submittedCount}
              totalCount={stats.activeOffices}
            />
          </div>
        </div>
      </div>
    </>
  );
}
