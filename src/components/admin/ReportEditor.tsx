"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CURRENCY_FORMATTER, REVENUE_FIELDS } from "@/lib/constants";
import { adminUpdateReport } from "@/actions/reports";
import { toast, Toaster } from "sonner";
import type { MonthlyReport } from "@/lib/types";

const STATUS_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  submitted: "bg-blue-100 text-blue-800",
  invoiced: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  draft: "bg-slate-100 text-slate-600",
};

interface AuditEntry {
  id: string;
  action: string;
  created_at: string;
  changes: Record<string, unknown>;
}

export function ReportEditor({
  reports,
  auditLog,
}: {
  reports: MonthlyReport[];
  auditLog: AuditEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingReport, setEditingReport] = useState<MonthlyReport | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  function openEdit(report: MonthlyReport) {
    setEditingReport(report);
    const vals: Record<string, string> = {};
    for (const f of REVENUE_FIELDS) {
      vals[f.name] = String(report[f.name as keyof MonthlyReport] ?? 0);
    }
    vals.notes = report.notes ?? "";
    setForm(vals);
  }

  function handleSave() {
    if (!editingReport) return;
    startTransition(async () => {
      const updates: Record<string, unknown> = {};
      for (const f of REVENUE_FIELDS) {
        updates[f.name] = parseFloat(form[f.name]) || 0;
      }
      if (form.notes) updates.notes = form.notes;

      const result = await adminUpdateReport(editingReport.id, updates);
      if (result.success) {
        toast.success("Report updated");
        setEditingReport(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update report");
      }
    });
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Total Gross</TableHead>
            <TableHead className="text-right">Royalty</TableHead>
            <TableHead className="text-right">Advertising</TableHead>
            <TableHead className="text-right">Total Fees</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No reports found.
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report) => {
              const date = new Date(report.report_month + "T00:00:00");
              const label = date.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              return (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell className="text-right">
                    {CURRENCY_FORMATTER.format(report.total_gross)}
                  </TableCell>
                  <TableCell className="text-right">
                    {CURRENCY_FORMATTER.format(report.royalty_fee)}
                  </TableCell>
                  <TableCell className="text-right">
                    {CURRENCY_FORMATTER.format(report.advertising_fee)}
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(report)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Audit Trail */}
      {auditLog.length > 0 && (
        <div className="p-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Audit Trail
          </h3>
          <div className="space-y-2">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3 py-1"
              >
                <span className="font-bold">{entry.action}</span> &mdash;{" "}
                {new Date(entry.created_at).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingReport}
        onOpenChange={(open) => !open && setEditingReport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {REVENUE_FIELDS.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form[field.name] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.name]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input
                value={form.notes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Optional admin notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
