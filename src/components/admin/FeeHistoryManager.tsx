"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PERCENTAGE_FORMATTER } from "@/lib/constants";
import { saveFeeHistory, getFeeHistory } from "@/actions/fees";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface OfficeOption {
  id: string;
  name: string;
  office_number: string;
  royalty_percentage: number;
  advertising_percentage: number;
}

interface FeeRow {
  id?: string;
  percentage: string;
  start_month: string;
  end_month: string;
}

export function FeeHistoryManager({
  offices,
  feeType,
}: {
  offices: OfficeOption[];
  feeType: "royalty" | "advertising";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOffice, setSelectedOffice] = useState("");
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(false);

  const label = feeType === "royalty" ? "Royalty" : "Advertising";

  const loadHistory = useCallback(async () => {
    if (!selectedOffice) {
      setRows([]);
      return;
    }

    setLoading(true);
    const result = await getFeeHistory(selectedOffice, feeType);
    if (result.success && result.data) {
      setRows(
        result.data.map((r: { id: string; percentage: number; start_month: string; end_month: string | null }) => ({
          id: r.id,
          percentage: String(r.percentage),
          start_month: r.start_month,
          end_month: r.end_month || "",
        }))
      );

      // If no history rows, seed with current rate from office
      if (result.data.length === 0) {
        const office = offices.find((o) => o.id === selectedOffice);
        if (office) {
          const currentRate =
            feeType === "royalty"
              ? office.royalty_percentage
              : office.advertising_percentage;
          setRows([
            {
              percentage: String(currentRate),
              start_month: "2013-01-01",
              end_month: "",
            },
          ]);
        }
      }
    }
    setLoading(false);
  }, [selectedOffice, feeType, offices]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { percentage: "0.06", start_month: "", end_month: "" },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof FeeRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function handleSave() {
    if (!selectedOffice) {
      toast.error("Please select a franchisee");
      return;
    }

    const parsed = rows.map((r) => ({
      id: r.id,
      percentage: parseFloat(r.percentage) || 0,
      start_month: r.start_month,
      end_month: r.end_month || null,
    }));

    // Validate
    for (const row of parsed) {
      if (!row.start_month) {
        toast.error("All rows must have a start month");
        return;
      }
      if (row.percentage < 0 || row.percentage > 1) {
        toast.error("Percentage must be between 0 and 1 (e.g. 0.06 = 6%)");
        return;
      }
    }

    startTransition(async () => {
      const result = await saveFeeHistory(selectedOffice, feeType, parsed);
      if (result.success) {
        toast.success(`${label} fee history saved`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save fee history");
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
              onChange={(e) => setSelectedOffice(e.target.value)}
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

        {/* Current Rate Display */}
        {selectedOffice && (
          <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
                {label} Fee History —{" "}
                {offices.find((o) => o.id === selectedOffice)?.name}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                  <Plus size={14} className="mr-1" /> Add Row
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isPending}
                  size="sm"
                  className="bg-brand-red hover:bg-brand-red-hover text-white"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400 py-4">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee %</TableHead>
                    <TableHead>Start Month/Year</TableHead>
                    <TableHead>End Month/Year</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        No fee history. Click &quot;Add Row&quot; to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              max="1"
                              value={row.percentage}
                              onChange={(e) =>
                                updateRow(index, "percentage", e.target.value)
                              }
                              className="w-20 md:w-28"
                            />
                            <span className="text-xs text-slate-400">
                              ({PERCENTAGE_FORMATTER(parseFloat(row.percentage) || 0)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={row.start_month}
                            onChange={(e) =>
                              updateRow(index, "start_month", e.target.value)
                            }
                            className="w-28 md:w-40"
                          />
                        </TableCell>
                        <TableCell>
                          {row.end_month ? (
                            <Input
                              type="date"
                              value={row.end_month}
                              onChange={(e) =>
                                updateRow(index, "end_month", e.target.value)
                              }
                              className="w-28 md:w-40"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-green-600">
                                Ongoing
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const today = new Date()
                                    .toISOString()
                                    .split("T")[0];
                                  updateRow(index, "end_month", today);
                                }}
                              >
                                Set End Date
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeRow(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* All Offices Overview */}
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
              All Franchisees — Current {label} Rate
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franchisee</TableHead>
                <TableHead className="text-right">Current {label} %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offices.map((office) => {
                const rate =
                  feeType === "royalty"
                    ? office.royalty_percentage
                    : office.advertising_percentage;
                return (
                  <TableRow
                    key={office.id}
                    className={
                      office.id === selectedOffice ? "bg-blue-50" : "cursor-pointer hover:bg-slate-50"
                    }
                    onClick={() => {
                      setSelectedOffice(office.id);
                      const main = document.querySelector("main");
                      if (main) main.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <TableCell className="font-bold">
                      {office.name}{" "}
                      <span className="text-xs text-slate-400">
                        #{office.office_number}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {PERCENTAGE_FORMATTER(Number(rate))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
