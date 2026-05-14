import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserCog } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  created_at: string;
}

const ROLES = ["super_admin", "content_manager", "moderator", "analytics_viewer"];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  content_manager: "Content manager",
  moderator: "Moderator",
  analytics_viewer: "Analytics viewer",
};

export default function AdminUsersPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminUser[] }>("/admin/users");
      return data.data;
    },
  });

  /* ── Create user ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });
  const [creating, setCreating] = useState(false);

  const resetForm = () => setForm({ name: "", email: "", password: "", role: "" });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.role) {
      toast({ title: "All fields are required.", variant: "error" }); return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters.", variant: "error" }); return;
    }
    setCreating(true);
    try {
      await api.post("/admin/users", form);
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "User created.", variant: "success" });
      setCreateOpen(false);
      resetForm();
    } catch {
      toast({ title: "Failed to create user.", variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  /* ── Update role ── */
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const updateRole = useMutation({
    mutationFn: async (input: { id: number; role: string }) =>
      api.patch(`/admin/users/${input.id}/role`, { role: input.role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  /* ── Delete user ── */
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const deleteUser = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    setDeletingId(u.id);
    try {
      await deleteUser.mutateAsync(u.id);
      toast({ title: "User deleted.", variant: "success" });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to delete user.";
      toast({ title: msg, variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage admin team members and their roles."
        actions={
          <Button variant="default" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="size-4" /> Add user
          </Button>
        }
      />

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.length ?? 0) === 0 ? (
                <TableEmpty colSpan={5}>No team members yet.</TableEmpty>
              ) : (
                data!.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r} tone="accent">{ROLE_LABELS[r] ?? r}</Badge>
                        ))}
                        {u.roles.length === 0 && <span className="text-xs text-muted-foreground">No role</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          defaultValue=""
                          disabled={updatingId === u.id}
                          onChange={async (e) => {
                            if (!e.target.value) return;
                            setUpdatingId(u.id);
                            try {
                              await updateRole.mutateAsync({ id: u.id, role: e.target.value });
                              toast({ title: "Role updated.", variant: "success" });
                            } catch {
                              toast({ title: "Failed to update role.", variant: "error" });
                            } finally {
                              setUpdatingId(null);
                              e.target.value = "";
                            }
                          }}
                          className="h-9 w-48 text-sm"
                        >
                          <option value="">Change role…</option>
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete user"
                          disabled={deletingId === u.id}
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="size-4 text-brand-red" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="size-4" /> Add Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="u-name">Name</Label>
              <Input id="u-name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="u-email">Email</Label>
              <Input id="u-email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="u-pw">Password</Label>
              <Input id="u-pw" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="u-role">Role</Label>
              <Select id="u-role" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="">Select a role…</option>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="default" size="sm" loading={creating} disabled={creating} onClick={handleCreate}>
              Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
