"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CURRENCY_FORMATTER,
  PERCENTAGE_FORMATTER,
  FRANCHISEE_STATUS_LABELS,
} from "@/lib/constants";

interface OfficeWithReport {
  id: string;
  name: string;
  office_number: string;
  status: string;
  royalty_percentage: number;
  advertising_percentage: number;
  currentReport: {
    id: string;
    status: string;
    total_gross: number;
    royalty_fee: number;
    advertising_fee: number;
    total_fees_due: number;
  } | null;
}

const REPORT_STATUS_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  submitted: "bg-blue-100 text-blue-800",
  invoiced: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  draft: "bg-slate-100 text-slate-600",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "non_reporting", label: "Non-Reporting" },
  { value: "terminated", label: "Terminated" },
];

export function OfficeStatusTable({ offices }: { offices: OfficeWithReport[] }) {
  const [filter, setFilter] = useState("all");

  const filtered = offices.filter((o) => {
    if (filter === "all") return true;
    if (filter === "pending") return !o.currentReport && o.status === "active";
    if (filter === "non_reporting") return o.status === "non_reporting";
    if (filter === "terminated") return o.status === "terminated";
    return o.currentReport?.status === filter;
  });

  return (
    <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
          Franchisee Status — Current Month
        </h2>
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-[4px] transition-all ${
                filter === opt.value
                  ? "bg-navy-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Franchisee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Royalty %</TableHead>
            <TableHead className="text-right">Advert. %</TableHead>
            <TableHead className="text-right">Gross Revenue</TableHead>
            <TableHead className="text-right">Fees Due</TableHead>
            <TableHead>Report</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No franchisees match this filter.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((office) => (
              <TableRow key={office.id}>
                <TableCell>
                  <Link
                    href={`/admin/offices/${office.id}`}
                    className="font-bold text-navy-900 hover:underline"
                  >
                    {office.name}
                  </Link>
                  <span className="text-xs text-slate-400 ml-2">
                    #{office.office_number}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      office.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : office.status === "terminated"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                    }
                  >
                    {FRANCHISEE_STATUS_LABELS[office.status] ?? office.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {PERCENTAGE_FORMATTER(Number(office.royalty_percentage))}
                </TableCell>
                <TableCell className="text-right">
                  {PERCENTAGE_FORMATTER(Number(office.advertising_percentage))}
                </TableCell>
                <TableCell className="text-right">
                  {office.currentReport
                    ? CURRENCY_FORMATTER.format(office.currentReport.total_gross)
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {office.currentReport
                    ? CURRENCY_FORMATTER.format(office.currentReport.total_fees_due)
                    : "—"}
                </TableCell>
                <TableCell>
                  {office.currentReport ? (
                    <Badge
                      variant="outline"
                      className={
                        REPORT_STATUS_CLASSES[office.currentReport.status] ?? ""
                      }
                    >
                      {office.currentReport.status.charAt(0).toUpperCase() +
                        office.currentReport.status.slice(1)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">No report</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
