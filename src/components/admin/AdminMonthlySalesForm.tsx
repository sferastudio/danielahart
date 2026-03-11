"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REVENUE_FIELDS, CURRENCY_FORMATTER, PERCENTAGE_FORMATTER } from "@/lib/constants";
import { adminSaveReport } from "@/actions/reports";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OfficeOption {
  id: string;
  name: string;
  office_number: string;
  royalty_percentage: number;
  advertising_percentage: number;
}

export function AdminMonthlySalesForm({
  offices,
}: {
  offices: OfficeOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialOffice = searchParams.get("office") || "";
  const now = new Date();
  const initialMonth =
    searchParams.get("month") ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [selectedOffice, setSelectedOffice] = useState(initialOffice);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [values, setValues] = useState<Record<string, number>>({
    tax_preparation_fees: 0,
    bookkeeping_fees: 0,
    insurance_commissions: 0,
    notary_copy_fax_fees: 0,
    translation_document_fees: 0,
    other_service_fees: 0,
  });
  const [existingReportId, setExistingReportId] = useState<string | null>(null);

  const office = offices.find((o) => o.id === selectedOffice);
  const totalGross = Object.values(values).reduce((sum, v) => sum + v, 0);
  const royaltyRate = office ? Number(office.royalty_percentage) : 0;
  const advertisingRate = office ? Number(office.advertising_percentage) : 0;
  const royaltyDue = totalGross * royaltyRate;
  const advertisingDue = totalGross * advertisingRate;

  const monthDate = new Date(currentMonth + "-01T00:00:00");
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const loadReport = useCallback(async () => {
    if (!selectedOffice || !currentMonth) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("office_id", selectedOffice)
      .eq("report_month", `${currentMonth}-01`)
      .single();

    if (data) {
      setValues({
        tax_preparation_fees: Number(data.tax_preparation_fees) || 0,
        bookkeeping_fees: Number(data.bookkeeping_fees) || 0,
        insurance_commissions: Number(data.insurance_commissions) || 0,
        notary_copy_fax_fees: Number(data.notary_copy_fax_fees) || 0,
        translation_document_fees: Number(data.translation_document_fees) || 0,
        other_service_fees: Number(data.other_service_fees) || 0,
      });
      setExistingReportId(data.id);
    } else {
      setValues({
        tax_preparation_fees: 0,
        bookkeeping_fees: 0,
        insurance_commissions: 0,
        notary_copy_fax_fees: 0,
        translation_document_fees: 0,
        other_service_fees: 0,
      });
      setExistingReportId(null);
    }
  }, [selectedOffice, currentMonth]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  function navigateMonth(direction: -1 | 1) {
    const d = new Date(currentMonth + "-01T00:00:00");
    d.setMonth(d.getMonth() + direction);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setCurrentMonth(newMonth);
    const params = new URLSearchParams();
    if (selectedOffice) params.set("office", selectedOffice);
    params.set("month", newMonth);
    router.push(`/admin/monthly-sales?${params.toString()}`);
  }

  function handleOfficeChange(officeId: string) {
    setSelectedOffice(officeId);
    const params = new URLSearchParams();
    if (officeId) params.set("office", officeId);
    params.set("month", currentMonth);
    router.push(`/admin/monthly-sales?${params.toString()}`);
  }

  function handleSave() {
    if (!selectedOffice) {
      toast.error("Please select a franchisee");
      return;
    }

    startTransition(async () => {
      const result = await adminSaveReport(selectedOffice, {
        report_month: `${currentMonth}-01`,
        tax_preparation_fees: values.tax_preparation_fees,
        bookkeeping_fees: values.bookkeeping_fees,
        insurance_commissions: values.insurance_commissions,
        notary_copy_fax_fees: values.notary_copy_fax_fees,
        translation_document_fees: values.translation_document_fees,
        other_service_fees: values.other_service_fees,
      });
      if (result.success) {
        toast.success("Report saved successfully");
        setExistingReportId(result.report?.id ?? null);
      } else {
        toast.error(result.error ?? "Failed to save report");
      }
    });
  }

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="space-y-6">
        {/* Franchisee Selection */}
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Select Franchisee
            </Label>
            <select
              value={selectedOffice}
              onChange={(e) => handleOfficeChange(e.target.value)}
              className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Select Franchisee —</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (#{o.office_number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Prev Month
            </Button>
            <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight min-w-[200px] text-center">
              {monthLabel}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(1)}
              className="flex items-center gap-1"
            >
              Next Month
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {selectedOffice && (
          <>
            {/* Revenue Entry Form */}
            <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-widest mb-6">
                Revenue Entry — {office?.name}
              </h3>
              {existingReportId && (
                <p className="text-xs text-slate-400 mb-4">
                  Editing existing report
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REVENUE_FIELDS.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <Label className="text-sm font-semibold">{field.label}</Label>
                    <p className="text-xs text-slate-400">{field.description}</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={values[field.name] || ""}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.name]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="pl-7"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Summary */}
            <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-widest mb-4">
                Calculated Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-50 rounded p-4 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Total Gross
                  </p>
                  <p className="text-lg font-bold text-navy-900">
                    {CURRENCY_FORMATTER.format(totalGross)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded p-4 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Royalty Rate
                  </p>
                  <p className="text-lg font-bold text-navy-900">
                    {PERCENTAGE_FORMATTER(royaltyRate)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded p-4 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Royalty Due
                  </p>
                  <p className="text-lg font-bold text-navy-900">
                    {CURRENCY_FORMATTER.format(royaltyDue)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded p-4 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Advert. Rate
                  </p>
                  <p className="text-lg font-bold text-navy-900">
                    {PERCENTAGE_FORMATTER(advertisingRate)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded p-4 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Advert. Fee Due
                  </p>
                  <p className="text-lg font-bold text-navy-900">
                    {CURRENCY_FORMATTER.format(advertisingDue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="bg-brand-red hover:bg-brand-red-hover text-white px-8"
              >
                {isPending ? "Saving..." : "Save Report"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
