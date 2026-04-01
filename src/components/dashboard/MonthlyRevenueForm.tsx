"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, ExternalLink } from "lucide-react";
import { CURRENCY_FORMATTER, PERCENTAGE_FORMATTER, REVENUE_FIELDS } from "@/lib/constants";
import type { RevenueFieldName } from "@/lib/constants";
import { useReportCalculations } from "@/hooks/useReportCalculations";
import { saveDraft, submitReport } from "@/actions/reports";
import { toast } from "sonner";

interface MonthlyRevenueFormProps {
  reportMonth: string;
  formattedDeadline: string;
  royaltyPercentage: number;
  advertisingPercentage: number;
  initialValues?: {
    tax_preparation_fees: number;
    bookkeeping_fees: number;
    insurance_commissions: number;
    notary_copy_fax_fees: number;
    translation_document_fees: number;
    other_service_fees: number;
  };
  reportStatus?: string;
  stripeInvoiceUrl?: string | null;
}

export function MonthlyRevenueForm({
  reportMonth,
  formattedDeadline,
  royaltyPercentage,
  advertisingPercentage,
  initialValues,
  reportStatus,
  stripeInvoiceUrl,
}: MonthlyRevenueFormProps) {
  const [values, setValues] = useState({
    tax_preparation_fees: initialValues?.tax_preparation_fees ?? 0,
    bookkeeping_fees: initialValues?.bookkeeping_fees ?? 0,
    insurance_commissions: initialValues?.insurance_commissions ?? 0,
    notary_copy_fax_fees: initialValues?.notary_copy_fax_fees ?? 0,
    translation_document_fees: initialValues?.translation_document_fees ?? 0,
    other_service_fees: initialValues?.other_service_fees ?? 0,
  });
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(reportStatus);
  const [currentInvoiceUrl, setCurrentInvoiceUrl] = useState(stripeInvoiceUrl);
  const router = useRouter();

  // Refresh server data when user returns to the tab (e.g. after paying on Stripe)
  useEffect(() => {
    if (currentStatus !== "invoiced") return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentStatus, router]);

  // Sync props back to local state when server data refreshes
  useEffect(() => {
    setCurrentStatus(reportStatus);
    setCurrentInvoiceUrl(stripeInvoiceUrl);
  }, [reportStatus, stripeInvoiceUrl]);

  const calculations = useReportCalculations({
    ...values,
    royalty_percentage: royaltyPercentage,
    advertising_percentage: advertisingPercentage,
  });

  const handleChange = useCallback((field: RevenueFieldName, value: string) => {
    const num = parseFloat(value) || 0;
    setValues((prev) => ({ ...prev, [field]: num }));
  }, []);

  const isAlreadySubmitted = currentStatus === "submitted" || currentStatus === "invoiced" || currentStatus === "paid";

  function handleSaveDraft() {
    startTransition(async () => {
      const result = await saveDraft({
        report_month: reportMonth,
        ...values,
      });
      if (result.success) {
        toast.success("Draft saved successfully");
      } else {
        toast.error(result.error ?? "Failed to save draft");
      }
    });
  }

  function handleSubmit() {
    if (calculations.total_gross <= 0) {
      toast.error("Please enter at least one revenue field before submitting");
      return;
    }

    setIsSubmitting(true);
    startTransition(async () => {
      const result = await submitReport({
        report_month: reportMonth,
        ...values,
      });
      setIsSubmitting(false);
      if (result.success) {
        if (result.invoiceUrl) {
          setCurrentStatus("invoiced");
          setCurrentInvoiceUrl(result.invoiceUrl);
          toast.success("Report submitted. Invoice ready for payment.");
        } else {
          setCurrentStatus("submitted");
          toast.success("Report submitted successfully.");
        }
      } else {
        toast.error(result.error ?? "Failed to submit report");
      }
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm">
      {/* Card Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} /> Monthly Revenue Entry
        </h2>
        <span className="text-[10px] font-bold text-slate-400">
          {formattedDeadline}
        </span>
      </div>

      {/* Input Grid — 6 fields in 3 rows of 2 */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-10 gap-y-4 md:gap-y-8">
        {REVENUE_FIELDS.map((field) => (
          <div key={field.name} className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label
                htmlFor={field.name}
                className="text-xs font-black text-navy-900 uppercase tracking-tight"
              >
                {field.label}
              </label>
              <span className="text-[10px] text-slate-400 italic">
                {field.description}
              </span>
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-900 font-bold opacity-30 group-focus-within:opacity-100 transition-opacity">
                $
              </span>
              <input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={isAlreadySubmitted}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 rounded-[4px] border border-slate-200 focus:bg-white focus:border-navy-900 outline-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                value={values[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Navy Totals Section */}
      <div className="bg-navy-900 text-white p-8">
        {/* Gross + Fees row */}
        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Calculated Total Gross
            </h3>
            <p className="text-4xl font-black tracking-tighter">
              {CURRENCY_FORMATTER.format(calculations.total_gross)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Platform Fees Applied
            </p>
            <p className="text-lg font-bold">
              {PERCENTAGE_FORMATTER(calculations.total_percentage)} Total
            </p>
          </div>
        </div>

        {/* Fee sub-boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="p-4 border border-white/10 rounded-[4px] bg-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
              Royalty ({PERCENTAGE_FORMATTER(royaltyPercentage)})
            </p>
            <p className="text-xl font-bold">
              {CURRENCY_FORMATTER.format(calculations.royalty_fee)}
            </p>
          </div>
          <div className="p-4 border border-white/10 rounded-[4px] bg-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
              Advertising ({PERCENTAGE_FORMATTER(advertisingPercentage)})
            </p>
            <p className="text-xl font-bold">
              {CURRENCY_FORMATTER.format(calculations.advertising_fee)}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-6">
          {currentStatus === "invoiced" && currentInvoiceUrl ? (
            <a
              href={currentInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 bg-brand-red hover:bg-brand-red-hover text-white font-black uppercase tracking-widest rounded-[4px] transition-all flex items-center justify-center gap-3"
            >
              Pay Invoice <ExternalLink size={18} />
            </a>
          ) : currentStatus === "paid" ? (
            <div className="flex-1 py-4 bg-green-600 text-white font-black uppercase tracking-widest rounded-[4px] flex items-center justify-center gap-3">
              Paid
            </div>
          ) : (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isPending || isAlreadySubmitted}
                className="px-6 py-4 border border-white/20 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending && !isSubmitting ? "Saving\u2026" : "Save Draft"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || isSubmitting || isAlreadySubmitted}
                className="flex-1 py-4 bg-brand-red hover:bg-brand-red-hover text-white font-black uppercase tracking-widest rounded-[4px] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting\u2026" : "Submit Report"}{" "}
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
