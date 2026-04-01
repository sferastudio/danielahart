"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CURRENCY_FORMATTER, PERCENTAGE_FORMATTER } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { toggleProcessed } from "@/actions/reports";
import { Download } from "lucide-react";
import { toast, Toaster } from "sonner";

interface OfficeOption {
  id: string;
  name: string;
  office_number: string;
  royalty_percentage: number;
  advertising_percentage: number;
  status: string;
}

interface ReportWithOffice {
  id: string;
  office_id: string;
  report_month: string;
  tax_preparation_fees: number;
  bookkeeping_fees: number;
  insurance_commissions: number;
  notary_copy_fax_fees: number;
  translation_document_fees: number;
  other_service_fees: number;
  total_gross: number;
  royalty_percentage: number;
  royalty_fee: number;
  advertising_percentage: number;
  advertising_fee: number;
  total_fees_due: number;
  is_processed: boolean;
  status: string;
  offices: { name: string; office_number: string } | null;
}

export function DateRangeReportForm({
  offices,
  initialReports,
}: {
  offices: OfficeOption[];
  initialReports: ReportWithOffice[];
}) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [officeFilter, setOfficeFilter] = useState("");
  const [zeroFilter, setZeroFilter] = useState(false);
  const [reports, setReports] = useState<ReportWithOffice[]>(initialReports);
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      const supabase = createClient();
      let query = supabase
        .from("monthly_reports")
        .select("*, offices(name, office_number)")
        .gte("report_month", `${startMonth}-01`)
        .lte("report_month", `${endMonth}-01`)
        .order("report_month", { ascending: true });

      if (officeFilter) {
        query = query.eq("office_id", officeFilter);
      }

      const { data } = await query;
      setReports((data ?? []) as ReportWithOffice[]);
    });
  }

  async function handleToggleProcessed(reportId: string, index: number) {
    const result = await toggleProcessed(reportId);
    if (result.success) {
      setReports((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, is_processed: result.is_processed! } : r
        )
      );
    } else {
      toast.error(result.error ?? "Failed to toggle processed");
    }
  }

  // Apply $0 filter client-side
  const filteredReports = zeroFilter
    ? reports.filter((r) => Number(r.total_gross) === 0)
    : reports;

  function handleExportCSV() {
    const headers = [
      "Month",
      "Franchisee",
      "Franchisee #",
      "Tax Preparation Fees",
      "Accounting/Bookkeeping Fees",
      "Insurance Commissions",
      "Notary/Copy/Fax/Internet/Computer Usage Fees",
      "Translation and Document Prep Fees",
      "Other Misc. Fees",
      "Total Gross Revenue",
      "Royalty %",
      "Royalty Due",
      "Advertising %",
      "Advertising Fee",
      "Total Fees Due",
      "Status",
      "Processed",
    ];

    const rows = filteredReports.map((r) => {
      const date = new Date(r.report_month + "T00:00:00");
      const month = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      return [
        month,
        r.offices?.name ?? "",
        r.offices?.office_number ?? "",
        r.tax_preparation_fees.toFixed(2),
        r.bookkeeping_fees.toFixed(2),
        r.insurance_commissions.toFixed(2),
        r.notary_copy_fax_fees.toFixed(2),
        r.translation_document_fees.toFixed(2),
        r.other_service_fees.toFixed(2),
        r.total_gross.toFixed(2),
        ((r.royalty_percentage ?? 0) * 100).toFixed(2) + "%",
        r.royalty_fee.toFixed(2),
        ((r.advertising_percentage ?? 0) * 100).toFixed(2) + "%",
        r.advertising_fee.toFixed(2),
        r.total_fees_due.toFixed(2),
        r.status,
        r.is_processed ? "Yes" : "No",
      ];
    });

    // Add totals row
    const csvTotals = filteredReports.reduce(
      (acc, r) => ({
        tax: acc.tax + Number(r.tax_preparation_fees),
        book: acc.book + Number(r.bookkeeping_fees),
        ins: acc.ins + Number(r.insurance_commissions),
        notary: acc.notary + Number(r.notary_copy_fax_fees),
        trans: acc.trans + Number(r.translation_document_fees),
        other: acc.other + Number(r.other_service_fees),
        gross: acc.gross + Number(r.total_gross),
        royalty: acc.royalty + Number(r.royalty_fee),
        advert: acc.advert + Number(r.advertising_fee),
        fees: acc.fees + Number(r.total_fees_due),
      }),
      {
        tax: 0, book: 0, ins: 0, notary: 0, trans: 0,
        other: 0, gross: 0, royalty: 0, advert: 0, fees: 0,
      }
    );

    rows.push([
      "TOTALS",
      "",
      "",
      csvTotals.tax.toFixed(2),
      csvTotals.book.toFixed(2),
      csvTotals.ins.toFixed(2),
      csvTotals.notary.toFixed(2),
      csvTotals.trans.toFixed(2),
      csvTotals.other.toFixed(2),
      csvTotals.gross.toFixed(2),
      "",
      csvTotals.royalty.toFixed(2),
      "",
      csvTotals.advert.toFixed(2),
      csvTotals.fees.toFixed(2),
      "",
      "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `franchisee_report_${startMonth}_to_${endMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Calculate totals for display
  const totals = filteredReports.reduce(
    (acc, r) => ({
      gross: acc.gross + Number(r.total_gross),
      royalty: acc.royalty + Number(r.royalty_fee),
      advert: acc.advert + Number(r.advertising_fee),
      fees: acc.fees + Number(r.total_fees_due),
    }),
    { gross: 0, royalty: 0, advert: 0, fees: 0 }
  );

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-right" />

      {/* Filters */}
      <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
        <div className="flex items-end gap-2 md:gap-6 flex-wrap">
          <div className="space-y-2">
            <Label>Start Month</Label>
            <Input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Month</Label>
            <Input
              type="month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Franchisee (optional)</Label>
            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-0"
            >
              <option value="">All Franchisees</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (#{o.office_number})
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleSearch}
            disabled={isPending}
            className="bg-navy-900 hover:bg-navy-800 text-white"
          >
            {isPending ? "Loading..." : "Generate Report"}
          </Button>
          <Button
            onClick={() => setZeroFilter(!zeroFilter)}
            variant={zeroFilter ? "default" : "outline"}
            className={zeroFilter ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
          >
            $0 Reports
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={filteredReports.length === 0}
          >
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">Proc.</TableHead>
              <TableHead>Franchisee</TableHead>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Tax Prep</TableHead>
              <TableHead className="text-right">Bookkeeping</TableHead>
              <TableHead className="text-right">Insurance</TableHead>
              <TableHead className="text-right">Notary/Other</TableHead>
              <TableHead className="text-right">Translation</TableHead>
              <TableHead className="text-right">Misc</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Royalty %</TableHead>
              <TableHead className="text-right">Royalty Due</TableHead>
              <TableHead className="text-right">Advert. %</TableHead>
              <TableHead className="text-right">Advert. Fee</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={15}
                  className="text-center text-muted-foreground py-8"
                >
                  {zeroFilter
                    ? "No $0 reports found for this period."
                    : "No reports found for this period."}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredReports.map((r, index) => {
                  const date = new Date(r.report_month + "T00:00:00");
                  const monthLabel = date.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });
                  const monthParam = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={r.is_processed ?? false}
                          onChange={() => handleToggleProcessed(r.id, index)}
                          className="rounded border-slate-300"
                        />
                      </TableCell>
                      <TableCell className="font-bold whitespace-nowrap">
                        {r.offices?.name ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {officeFilter ? (
                          <Link
                            href={`/admin/monthly-sales?office=${r.office_id}&month=${monthParam}`}
                            className="text-blue-600 hover:underline"
                          >
                            {monthLabel}
                          </Link>
                        ) : (
                          monthLabel
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.tax_preparation_fees)}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.bookkeeping_fees)}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.insurance_commissions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.notary_copy_fax_fees)}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.translation_document_fees)}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.other_service_fees)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {CURRENCY_FORMATTER.format(r.total_gross)}
                      </TableCell>
                      <TableCell className="text-right">
                        {PERCENTAGE_FORMATTER(Number(r.royalty_percentage ?? 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.royalty_fee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {PERCENTAGE_FORMATTER(
                          Number(r.advertising_percentage ?? 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {CURRENCY_FORMATTER.format(r.advertising_fee)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : r.status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : ""
                          }
                        >
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Totals Row */}
                <TableRow className="bg-slate-50 font-bold">
                  <TableCell />
                  <TableCell colSpan={8} className="text-right uppercase text-xs tracking-widest">
                    Totals
                  </TableCell>
                  <TableCell className="text-right">
                    {CURRENCY_FORMATTER.format(totals.gross)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right">
                    {CURRENCY_FORMATTER.format(totals.royalty)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right">
                    {CURRENCY_FORMATTER.format(totals.advert)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
