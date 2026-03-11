"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { PERCENTAGE_FORMATTER, FRANCHISEE_STATUS_LABELS } from "@/lib/constants";
import { updateOfficeFees } from "@/actions/fees";
import { toast, Toaster } from "sonner";

interface OfficeForFees {
  id: string;
  name: string;
  office_number: string;
  royalty_percentage: number;
  advertising_percentage: number;
  status: string;
}

interface AuditEntry {
  id: string;
  created_at: string;
  changes: Record<string, unknown>;
}

export function FeeManager({
  offices,
  auditLog,
}: {
  offices: OfficeForFees[];
  auditLog: AuditEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<OfficeForFees | null>(null);
  const [royalty, setRoyalty] = useState("");
  const [advertising, setAdvertising] = useState("");

  function openEdit(office: OfficeForFees) {
    setEditing(office);
    setRoyalty(String(office.royalty_percentage));
    setAdvertising(String(office.advertising_percentage));
  }

  function handleSave() {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateOfficeFees(
        editing.id,
        parseFloat(royalty),
        parseFloat(advertising)
      );
      if (result.success) {
        toast.success(`Fees updated for ${editing.name}`);
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update fees");
      }
    });
  }

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
            Per-Franchisee Fee Rates
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Franchisee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Royalty %</TableHead>
              <TableHead className="text-right">Advertising %</TableHead>
              <TableHead className="text-right">Combined %</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {offices.map((office) => (
              <TableRow key={office.id}>
                <TableCell className="font-bold">
                  {office.name}{" "}
                  <span className="text-xs text-slate-400">#{office.office_number}</span>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {FRANCHISEE_STATUS_LABELS[office.status] ?? office.status}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {PERCENTAGE_FORMATTER(Number(office.royalty_percentage))}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {PERCENTAGE_FORMATTER(Number(office.advertising_percentage))}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {PERCENTAGE_FORMATTER(
                    Number(office.royalty_percentage) +
                      Number(office.advertising_percentage)
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(office)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Fee Change History */}
      {auditLog.length > 0 && (
        <div className="mt-8 bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-widest mb-4">
            Fee Change History
          </h3>
          <div className="space-y-3">
            {auditLog.map((entry) => {
              const changes = entry.changes as {
                before?: { royalty_percentage?: number; advertising_percentage?: number };
                after?: { royalty_percentage?: number; advertising_percentage?: number };
              };
              return (
                <div
                  key={entry.id}
                  className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3 py-1"
                >
                  <span className="font-bold">Fee Updated</span> &mdash;{" "}
                  {new Date(entry.created_at).toLocaleString()}
                  {changes.before && changes.after && (
                    <span className="ml-2">
                      Royalty: {PERCENTAGE_FORMATTER(Number(changes.before.royalty_percentage ?? 0))} →{" "}
                      {PERCENTAGE_FORMATTER(Number(changes.after.royalty_percentage ?? 0))} | Advert.:{" "}
                      {PERCENTAGE_FORMATTER(Number(changes.before.advertising_percentage ?? 0))} →{" "}
                      {PERCENTAGE_FORMATTER(Number(changes.after.advertising_percentage ?? 0))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Fees — {editing?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Royalty Percentage (decimal, e.g. 0.10 = 10%)</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={royalty}
                onChange={(e) => setRoyalty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Advertising Percentage (decimal, e.g. 0.02 = 2%)</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={advertising}
                onChange={(e) => setAdvertising(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              {isPending ? "Saving..." : "Update Fees"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
