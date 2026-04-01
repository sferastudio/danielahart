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
import {
  PERCENTAGE_FORMATTER,
  FRANCHISEE_STATUS_LABELS,
} from "@/lib/constants";
import { createOffice, updateOffice } from "@/actions/offices";
import { toast, Toaster } from "sonner";
import type { Office, OfficeStatus } from "@/lib/types";

const EMPTY_FORM = {
  name: "",
  office_number: "",
  email: "",
  address: "",
  phone: "",
  royalty_percentage: "0.10",
  advertising_percentage: "0.02",
  status: "active" as OfficeStatus,
};

export function OfficeManager({ offices }: { offices: Office[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function openCreate() {
    setEditingOffice(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  function openEdit(office: Office) {
    setEditingOffice(office);
    setForm({
      name: office.name,
      office_number: office.office_number,
      email: office.email,
      address: office.address ?? "",
      phone: office.phone ?? "",
      royalty_percentage: String(office.royalty_percentage),
      advertising_percentage: String(office.advertising_percentage),
      status: office.status,
    });
    setShowDialog(true);
  }

  function handleSave() {
    startTransition(async () => {
      const data = {
        name: form.name,
        office_number: form.office_number,
        email: form.email,
        address: form.address,
        phone: form.phone,
        royalty_percentage: parseFloat(form.royalty_percentage),
        advertising_percentage: parseFloat(form.advertising_percentage),
        status: form.status,
      };

      const result = editingOffice
        ? await updateOffice(editingOffice.id, data)
        : await createOffice(data);

      if (result.success) {
        toast.success(editingOffice ? "Franchisee updated" : "Franchisee created");
        setShowDialog(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save franchisee");
      }
    });
  }

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
            All Franchisees
          </h2>
          <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red-hover text-white">
            Add Franchisee
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Royalty %</TableHead>
              <TableHead className="text-right">Advert. %</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {offices.map((office) => (
              <TableRow key={office.id}>
                <TableCell className="font-bold">{office.name}</TableCell>
                <TableCell>#{office.office_number}</TableCell>
                <TableCell className="text-sm text-slate-500">{office.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {FRANCHISEE_STATUS_LABELS[office.status] ?? office.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {PERCENTAGE_FORMATTER(Number(office.royalty_percentage))}
                </TableCell>
                <TableCell className="text-right">
                  {PERCENTAGE_FORMATTER(Number(office.advertising_percentage))}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOffice ? "Edit Franchisee" : "Add New Franchisee"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <div className="space-y-2">
                <Label>Franchisee Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Franchisee Number</Label>
                <Input
                  value={form.office_number}
                  onChange={(e) => setForm((f) => ({ ...f, office_number: e.target.value }))}
                  disabled={!!editingOffice}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              <div className="space-y-2">
                <Label>Royalty %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.royalty_percentage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, royalty_percentage: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Advertising %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.advertising_percentage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, advertising_percentage: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as OfficeStatus }))
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="non_reporting">Non-Reporting</option>
                  <option value="terminated">Terminated</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              {isPending ? "Saving..." : editingOffice ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
