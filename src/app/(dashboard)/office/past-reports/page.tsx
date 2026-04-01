import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download } from "lucide-react";
import { STYLES, CURRENCY_FORMATTER, PERCENTAGE_FORMATTER } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  invoiced: "outline",
  paid: "default",
  overdue: "destructive",
};

const STATUS_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  submitted: "bg-blue-100 text-blue-800",
  invoiced: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

export default async function PastReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const office_id =
    user.app_metadata?.office_id ?? user.user_metadata?.office_id;

  const { data: reports } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("office_id", office_id)
    .neq("status", "draft")
    .order("report_month", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="PAST REPORTS" subtitle="FRANCHISEE PORTAL" />

      <div className="rounded-lg bg-white p-6 shadow-sm">
        {!reports || reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No submitted reports yet.
          </p>
        ) : (
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
              {reports.map((report) => {
                const monthDate = new Date(report.report_month + "T00:00:00");
                const monthLabel = monthDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <TableRow key={report.id}>
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
                        variant={STATUS_VARIANT[report.status] ?? "secondary"}
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
        )}
      </div>
    </div>
  );
}
