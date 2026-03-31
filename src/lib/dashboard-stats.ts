import { OfficeWithReport, MonthlyReport, DashboardStats } from "./types";
import { REPORT_DEADLINE_DAY } from "./constants";

export function computeDashboardStats(
  offices: OfficeWithReport[],
  prevReports: MonthlyReport[]
): DashboardStats {
  const activeOffices = offices.filter((o) => o.status === "active");
  const activeOfficeCount = activeOffices.length;

  // submissionRate
  const submittedStatuses = new Set(["submitted", "invoiced", "paid"]);
  const submittedCount = activeOffices.filter(
    (o) => o.currentReport && submittedStatuses.has(o.currentReport.status)
  ).length;
  const submissionRate =
    activeOfficeCount > 0 ? submittedCount / activeOfficeCount : 0;

  // totalGrossRevenue
  const totalGrossRevenue = offices.reduce(
    (sum, o) => sum + (o.currentReport?.total_gross ?? 0),
    0
  );

  // revenueChange
  const prevTotal = prevReports.reduce((sum, r) => sum + r.total_gross, 0);
  const revenueChange =
    prevTotal > 0 ? ((totalGrossRevenue - prevTotal) / prevTotal) * 100 : 0;

  // feesCollected
  const feesCollected = offices.reduce(
    (sum, o) =>
      sum +
      (o.currentReport?.status === "paid"
        ? o.currentReport.total_fees_due
        : 0),
    0
  );

  // feesOutstanding
  const outstandingStatuses = new Set(["submitted", "invoiced"]);
  const feesOutstanding = offices.reduce(
    (sum, o) =>
      sum +
      (o.currentReport && outstandingStatuses.has(o.currentReport.status)
        ? o.currentReport.total_fees_due
        : 0),
    0
  );

  // daysUntilDeadline
  const now = new Date();
  const deadline = new Date(
    now.getFullYear(),
    now.getMonth(),
    REPORT_DEADLINE_DAY
  );
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - now.getTime()) / msPerDay
  );

  // overdueReports
  const overdueReports = activeOffices.filter(
    (o) =>
      daysUntilDeadline < 0 &&
      (!o.currentReport || o.currentReport.status === "overdue")
  ).length;

  return {
    submissionRate,
    totalGrossRevenue,
    revenueChange,
    feesCollected,
    feesOutstanding,
    overdueReports,
    activeOffices: activeOfficeCount,
    daysUntilDeadline,
  };
}
