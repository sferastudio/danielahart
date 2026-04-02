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
import { createUser, updateUserStatus, deleteUser, resetUserPassword } from "@/actions/users";
import { toast, Toaster } from "sonner";
import type { UserRole } from "@/lib/types";

interface ProfileWithOffice {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  office_id: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  created_at: string;
  offices: { name: string; office_number: string; phone: string | null; email: string | null } | null;
}

interface OfficeOption {
  id: string;
  name: string;
  office_number: string;
}

export function UserManager({
  profiles,
  offices,
  emailMap,
}: {
  profiles: ProfileWithOffice[];
  offices: OfficeOption[];
  emailMap: Record<string, string>;
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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

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

  function handleResetPassword() {
    if (!resetTarget) return;
    startTransition(async () => {
      const result = await resetUserPassword(resetTarget.id, newPassword);
      if (result.success) {
        toast.success(`Password updated for ${resetTarget.name}`);
        setShowResetPassword(false);
        setResetTarget(null);
        setNewPassword("");
      } else {
        toast.error(result.error ?? "Failed to reset password");
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
              <TableHead>Email</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
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
                <TableCell className="text-sm text-slate-600">
                  {emailMap[profile.id] || "—"}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {profile.contact_first_name || profile.contact_last_name
                    ? `${profile.contact_first_name ?? ""} ${profile.contact_last_name ?? ""}`.trim()
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {profile.offices?.phone || "—"}
                </TableCell>
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
                  {new Date(profile.created_at).toLocaleDateString("en-US")}
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
                      onClick={() => {
                        setResetTarget({ id: profile.id, name: profile.full_name });
                        setNewPassword("");
                        setShowResetPassword(true);
                      }}
                      disabled={isPending}
                    >
                      Reset Password
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 pt-2 border-t border-slate-100">
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

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Set a new password for <strong>{resetTarget?.name}</strong>.
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPassword(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isPending || newPassword.length < 8}
              className="bg-brand-red hover:bg-brand-red-hover text-white"
            >
              {isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
