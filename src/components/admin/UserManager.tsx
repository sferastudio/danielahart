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
import { createUser, updateUserStatus, deleteUser } from "@/actions/users";
import { toast, Toaster } from "sonner";
import type { UserRole } from "@/lib/types";

interface ProfileWithOffice {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  office_id: string | null;
  created_at: string;
  offices: { name: string; office_number: string } | null;
}

interface OfficeOption {
  id: string;
  name: string;
  office_number: string;
}

export function UserManager({
  profiles,
  offices,
}: {
  profiles: ProfileWithOffice[];
  offices: OfficeOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "sub_office" as UserRole,
    office_id: "",
    contact_first_name: "",
    contact_last_name: "",
    phone: "",
    fax: "",
    address: "",
    city: "",
    state: "GA",
    zip: "",
    is_active: true,
  });

  function handleCreate() {
    startTransition(async () => {
      const result = await createUser({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        office_id: form.office_id || undefined,
        contact_first_name: form.contact_first_name || undefined,
        contact_last_name: form.contact_last_name || undefined,
        phone: form.phone || undefined,
        fax: form.fax || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zip: form.zip || undefined,
        is_active: form.is_active,
      });
      if (result.success) {
        toast.success("User created");
        setShowCreate(false);
        setForm({
          email: "",
          password: "",
          full_name: "",
          role: "sub_office",
          office_id: "",
          contact_first_name: "",
          contact_last_name: "",
          phone: "",
          fax: "",
          address: "",
          city: "",
          state: "GA",
          zip: "",
          is_active: true,
        });
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to create user");
      }
    });
  }

  function handleToggleStatus(profileId: string, currentActive: boolean) {
    startTransition(async () => {
      const result = await updateUserStatus(profileId, !currentActive);
      if (result.success) {
        toast.success(currentActive ? "User suspended" : "User reactivated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update user");
      }
    });
  }

  function handleDelete(profileId: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteUser(profileId);
      if (result.success) {
        toast.success("User deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete user");
      }
    });
  }

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
            All Users
          </h2>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-brand-red hover:bg-brand-red-hover text-white"
          >
            Add User
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Franchisee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-bold">{profile.full_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {profile.role === "admin" ? "Admin" : "Franchisee"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {profile.offices
                    ? `${profile.offices.name} (#${profile.offices.office_number})`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      profile.is_active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {profile.is_active ? "Active" : "Suspended"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {new Date(profile.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleToggleStatus(profile.id, profile.is_active)
                      }
                      disabled={isPending}
                    >
                      {profile.is_active ? "Suspend" : "Reactivate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() =>
                        handleDelete(profile.id, profile.full_name)
                      }
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact First Name</Label>
                <Input
                  value={form.contact_first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact_first_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Last Name</Label>
                <Input
                  value={form.contact_last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact_last_name: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Franchisee Location</Label>
              <select
                value={form.office_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, office_id: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No Franchisee</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} (#{o.office_number})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dealer Email (Username)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fax</Label>
                <Input
                  type="tel"
                  value={form.fax}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fax: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Province/State</Label>
                <Input
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Postal/Zip</Label>
                <Input
                  value={form.zip}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zip: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="login-access"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="rounded border-slate-300"
                />
                <Label htmlFor="login-access">Login Access</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="admin-access"
                  checked={form.role === "admin"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.checked ? "admin" : "sub_office",
                    }))
                  }
                  className="rounded border-slate-300"
                />
                <Label htmlFor="admin-access">Administrative Access</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
