"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CURRENCY_FORMATTER,
  PERCENTAGE_FORMATTER,
  FRANCHISEE_STATUS_LABELS,
} from "@/lib/constants";
import { OfficeWithReport } from "@/lib/types";
import {
  Search,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Bell,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { sendReminder, markReviewed, markAsPaid } from "@/actions/reports";
import { toast } from "sonner";

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

type SortColumn =
  | "name"
  | "status"
  | "royalty_percentage"
  | "advertising_percentage"
  | "total_gross"
  | "total_fees_due"
  | "report_status";
type SortDirection = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50];

function getSortValue(office: OfficeWithReport, col: SortColumn): string | number {
  switch (col) {
    case "name":
      return office.name.toLowerCase();
    case "status":
      return office.status;
    case "royalty_percentage":
      return Number(office.royalty_percentage);
    case "advertising_percentage":
      return Number(office.advertising_percentage);
    case "total_gross":
      return office.currentReport?.total_gross ?? -1;
    case "total_fees_due":
      return office.currentReport?.total_fees_due ?? -1;
    case "report_status":
      return office.currentReport?.status ?? "";
  }
}

function SortIcon({ column, sortColumn, sortDirection }: {
  column: SortColumn;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
}) {
  if (sortColumn !== column) {
    return <ChevronUp className="size-3 opacity-20" />;
  }
  return sortDirection === "asc" ? (
    <ChevronUp className="size-3" />
  ) : (
    <ChevronDown className="size-3" />
  );
}

export function OfficeStatusTable({ offices, periodLabel }: { offices: OfficeWithReport[]; periodLabel?: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => setMounted(true), []);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
    setPage(0);
  };

  const processedData = useMemo(() => {
    let result = offices.filter((o) => {
      if (filter === "all") return true;
      if (filter === "pending") return !o.currentReport && o.status === "active";
      if (filter === "non_reporting") return o.status === "non_reporting";
      if (filter === "terminated") return o.status === "terminated";
      return o.currentReport?.status === filter;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.office_number.toLowerCase().includes(q)
      );
    }

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const aVal = getSortValue(a, sortColumn);
        const bVal = getSortValue(b, sortColumn);
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [offices, filter, search, sortColumn, sortDirection]);

  const totalItems = processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedData = processedData.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  );
  const showingFrom = totalItems === 0 ? 0 : safePage * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize + pageSize, totalItems);

  const handleSendReminder = async (officeId: string) => {
    const result = await sendReminder(officeId);
    if (result.success) {
      toast.success("Reminder logged successfully");
    } else {
      toast.error(result.error ?? "Failed to send reminder");
    }
  };

  const handleMarkReviewed = async (reportId: string) => {
    const result = await markReviewed(reportId);
    if (result.success) {
      toast.success("Report marked as reviewed");
    } else {
      toast.error(result.error ?? "Failed to mark as reviewed");
    }
  };

  const handleMarkAsPaid = async (reportId: string) => {
    const result = await markAsPaid(reportId);
    if (result.success) {
      toast.success("Report marked as paid");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to mark as paid");
    }
  };

  const SortableHead = ({
    col,
    children,
    className,
  }: {
    col: SortColumn;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-slate-50 ${className ?? ""}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortIcon column={col} sortColumn={sortColumn} sortDirection={sortDirection} />
      </span>
    </TableHead>
  );

  return (
    <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
      <div className="p-4 md:p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
            Franchisee Status — {periodLabel ?? "Current Month"}
          </h2>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setFilter(opt.value);
                  setPage(0);
                }}
                className={`px-2.5 md:px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wide rounded-[4px] transition-all ${
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
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search by name or franchisee number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead col="name">Franchisee</SortableHead>
            <SortableHead col="status">Status</SortableHead>
            <SortableHead col="royalty_percentage" className="text-right">Royalty %</SortableHead>
            <SortableHead col="advertising_percentage" className="text-right">Advert. %</SortableHead>
            <SortableHead col="total_gross" className="text-right">Gross Revenue</SortableHead>
            <SortableHead col="total_fees_due" className="text-right">Fees Due</SortableHead>
            <SortableHead col="report_status">Report</SortableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No franchisees match this filter.
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((office) => (
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
                <TableCell>
                  {mounted ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-slate-100"
                      >
                        <MoreHorizontal className="size-4 text-slate-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            window.location.href = `/admin/monthly-sales?office=${office.id}`;
                          }}
                        >
                          <Eye className="size-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleSendReminder(office.id)}
                        >
                          <Bell className="size-4 mr-2" />
                          Send Reminder
                        </DropdownMenuItem>
                        {office.currentReport && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleMarkReviewed(office.currentReport!.id)
                            }
                          >
                            <CheckCircle className="size-4 mr-2" />
                            Mark Reviewed
                          </DropdownMenuItem>
                        )}
                        {office.currentReport && office.currentReport.status !== "paid" && office.currentReport.status !== "draft" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleMarkAsPaid(office.currentReport!.id)
                            }
                          >
                            <DollarSign className="size-4 mr-2" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="inline-flex items-center justify-center size-8">
                      <MoreHorizontal className="size-4 text-slate-500" />
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="px-4 md:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>
            Showing {showingFrom}–{showingTo} of {totalItems}
          </span>
          <span className="text-slate-300">|</span>
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="border border-slate-200 rounded px-2 py-1 text-sm bg-white"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
