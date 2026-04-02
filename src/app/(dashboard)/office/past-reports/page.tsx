import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download } from "lucide-react";
import Link from "next/link";
import { CURRENCY_FORMATTER, PERCENTAGE_FORMATTER } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  submitted: "bg-blue-100 text-blue-800",
  invoiced: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

function generateMonthList(fromDate: Date, toDate: Date): string[] {
  const months: string[] = [];
  const startY = fromDate.getFullYear();
  const startM = fromDate.getMonth();
  const endY = toDate.getFullYear();
  const endM = toDate.getMonth();

  for (let y = endY, m = endM; y > startY || (y === startY && m >= startM); m--) {
    if (m < 0) { m = 11; y--; continue; }
    months.push(`${y}-${String(m + 1).padStart(2, "0")}-01`);
  }
  return months;
}

export default async function PastReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const office_id =
    user.app_metadata?.office_id ?? user.user_metadata?.office_id;

  // Fetch office creation date for month range
  const { data: office } = await supabase
    .from("offices")
    .select("created_at")
    .eq("id", office_id)
    .single();

  const officeCreated = office?.created_at
    ? new Date(office.created_at)
    : new Date();

  // Fetch all filed reports (excluding drafts)
  const { data: reports } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("office_id", office_id)
    .neq("status", "draft");

  // Index reports by month
  const reportsByMonth = new Map(
    (reports ?? []).map((r) => [r.report_month, r])
  );

  // Use earliest report date or office creation, whichever is earlier
  const earliestReport = reports?.length
    ? new Date(
        reports.reduce((min, r) => (r.report_month < min ? r.report_month : min), reports[0].report_month) + "T00:00:00"
      )
    : null;
  const startDate = earliestReport && earliestReport < officeCreated ? earliestReport : officeCreated;

  // Generate all months from start date through current month
  const now = new Date();
  const allMonths = generateMonthList(startDate, now);

  return (
    <div className="space-y-6">
      <PageHeader title="PAST REPORTS" subtitle="FRANCHISEE PORTAL" />

      <div className="rounded-lg bg-white p-4 md:p-6 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Total Gross</TableHead>
                <TableHead className="text-right">Royalty Fee</TableHead>
                <TableHead className="text-right">Advertising Fee</TableHead>
                <TableHead className="text-right">Total Fees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allMonths.map((month) => {
                const report = reportsByMonth.get(month);
                const monthDate = new Date(month + "T00:00:00");
                const monthLabel = monthDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });

                if (!report) {
                  // Unfiled month
                  return (
                    <TableRow key={month} className="bg-slate-50/50">
                      <TableCell className="font-medium">{monthLabel}</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell className="text-right text-slate-400">—</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                          Unfiled
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/office/dashboard?month=${month}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-red hover:underline"
                        >
                          File Report
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                }

                // Filed month
                return (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{monthLabel}</TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.total_gross)}
                    </TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.royalty_fee)}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({PERCENTAGE_FORMATTER(Number(report.royalty_percentage))})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.advertising_fee)}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({PERCENTAGE_FORMATTER(Number(report.advertising_percentage))})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_FORMATTER.format(report.total_fees_due)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_CLASSES[report.status] ?? ""}
                      >
                        {report.status.charAt(0).toUpperCase() +
                          report.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {report.status === "invoiced" && report.stripe_invoice_url && (
                        <a
                          href={report.stripe_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-red hover:underline"
                        >
                          Pay Invoice <ExternalLink className="size-3" />
                        </a>
                      )}
                      {report.status === "paid" && report.stripe_invoice_url && (
                        <a
                          href={report.stripe_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline"
                        >
                          View Receipt <ExternalLink className="size-3" />
                        </a>
                      )}
                      {report.stripe_invoice_pdf && (
                        <a
                          href={report.stripe_invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:underline"
                        >
                          PDF <Download className="size-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
