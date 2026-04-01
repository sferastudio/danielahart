"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthlyRevenueForm } from "@/components/dashboard/MonthlyRevenueForm";
import { SubmissionStatus } from "@/components/dashboard/SubmissionStatus";
import { DeadlineWarning } from "@/components/dashboard/DeadlineWarning";
import { useCurrentPeriod } from "@/hooks/useCurrentPeriod";
import { Toaster } from "sonner";
import { ArrowLeft } from "lucide-react";

interface RecentReport {
  report_month: string;
  status: string;
  paid_at: string | null;
}

interface OfficeDashboardClientProps {
  reportMonth: string;
  isCurrentMonth: boolean;
  royaltyPercentage: number;
  advertisingPercentage: number;
  currentReport: {
    tax_preparation_fees: number;
    bookkeeping_fees: number;
    insurance_commissions: number;
    notary_copy_fax_fees: number;
    translation_document_fees: number;
    other_service_fees: number;
    status: string;
    stripe_invoice_url: string | null;
  } | null;
  recentReports: RecentReport[];
}

export function OfficeDashboardClient({
  reportMonth,
  isCurrentMonth,
  royaltyPercentage,
  advertisingPercentage,
  currentReport,
  recentReports,
}: OfficeDashboardClientProps) {
  const period = useCurrentPeriod();

  const reportMonthDate = new Date(reportMonth + "T00:00:00");
  const reportMonthLabel = reportMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthStatuses = recentReports.map((r) => {
    const date = new Date(r.report_month + "T00:00:00");
    const monthLabel = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const paidDate = r.paid_at
      ? new Date(r.paid_at).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
      : undefined;

    return {
      month: monthLabel,
      status: r.status as
        | "paid"
        | "submitted"
        | "invoiced"
        | "draft"
        | "overdue"
        | "none",
      date: paidDate,
    };
  });

  return (
    <>
      <Toaster richColors position="top-right" />

      <PageHeader
        title="Dashboard"
        subtitle="Franchisee Portal"
        periodLabel="Reporting Period"
        periodValue={isCurrentMonth ? period.current_month : reportMonthLabel}
        daysRemaining={isCurrentMonth ? period.days_remaining : undefined}
        isOverdue={isCurrentMonth ? period.is_overdue : undefined}
      />

      {/* Prior month banner */}
      {!isCurrentMonth && (
        <div className="mx-4 md:mx-10 mt-4 flex items-center justify-between rounded-[4px] border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">
            Filing report for <strong>{reportMonthLabel}</strong>
          </p>
          <Link
            href="/office/dashboard"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
          >
            <ArrowLeft className="size-3" />
            Back to current month
          </Link>
        </div>
      )}

      <div className="px-4 md:px-10 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form — 8 cols */}
          <div className="lg:col-span-8">
            <MonthlyRevenueForm
              reportMonth={reportMonth}
              formattedDeadline={isCurrentMonth ? period.formatted_deadline : `FOR ${reportMonthLabel.toUpperCase()}`}
              royaltyPercentage={royaltyPercentage}
              advertisingPercentage={advertisingPercentage}
              reportStatus={currentReport?.status}
              stripeInvoiceUrl={currentReport?.stripe_invoice_url}
              initialValues={
                currentReport
                  ? {
                      tax_preparation_fees: Number(
                        currentReport.tax_preparation_fees
                      ),
                      bookkeeping_fees: Number(
                        currentReport.bookkeeping_fees
                      ),
                      insurance_commissions: Number(
                        currentReport.insurance_commissions
                      ),
                      notary_copy_fax_fees: Number(
                        currentReport.notary_copy_fax_fees
                      ),
                      translation_document_fees: Number(
                        currentReport.translation_document_fees
                      ),
                      other_service_fees: Number(
                        currentReport.other_service_fees
                      ),
                    }
                  : undefined
              }
            />
          </div>

          {/* Right Sidebar — 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <SubmissionStatus months={monthStatuses} />
            {isCurrentMonth && !period.is_overdue && period.days_remaining <= 5 && !currentReport?.status?.match(/^(submitted|invoiced|paid)$/) && (
              <DeadlineWarning />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
