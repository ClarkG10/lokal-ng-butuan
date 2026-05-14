import { useState } from "react";
import { Lock, LogOut, Moon, Pencil, Shield, Sun, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/AuthContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

/* ── Compact toggle row ──────────────────────────────────── */
function ToggleRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  const id = `t-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-medium">{label}</label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${checked ? "bg-brand-green" : "bg-muted"}`}
      >
        <span className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

/* ── Divider ─────────────────────────────────────────────── */
function Divider() { return <hr className="border-border" />; }

/* ── Section heading ─────────────────────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

export default function AdminSettingsPage() {
  const { user, logout, refresh } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();

  /* ── Edit Profile modal ─────────────────────────────────── */
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [profilePending, setProfilePending] = useState(false);

  const openProfile = () => {
    setProfileForm({ name: user?.name ?? "", email: user?.email ?? "" });
    setProfileOpen(true);
  };
  const saveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast({ title: "Name and email are required.", variant: "error" }); return;
    }
    setProfilePending(true);
    try {
      await api.put("/me", { name: profileForm.name.trim(), email: profileForm.email.trim() });
      await refresh();
      toast({ title: "Profile updated.", variant: "success" });
      setProfileOpen(false);
    } catch {
      toast({ title: "Failed to update profile.", variant: "error" });
    } finally {
      setProfilePending(false);
    }
  };

  /* ── Change Password modal ──────────────────────────────── */
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwPending, setPwPending] = useState(false);

  const changePassword = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      toast({ title: "All fields are required.", variant: "error" }); return;
    }
    if (pw.next !== pw.confirm) {
      toast({ title: "New passwords do not match.", variant: "error" }); return;
    }
    if (pw.next.length < 8) {
      toast({ title: "Password must be at least 8 characters.", variant: "error" }); return;
    }
    setPwPending(true);
    try {
      await api.put("/me/password", {
        current_password: pw.current,
        password: pw.next,
        password_confirmation: pw.confirm,
      });
      toast({ title: "Password updated.", variant: "success" });
      setPw({ current: "", next: "", confirm: "" });
      setPwOpen(false);
    } catch {
      toast({ title: "Incorrect current password.", variant: "error" });
    } finally {
      setPwPending(false);
    }
  };

  /* ── Notifications ──────────────────────────────────────── */
  const [notifResponse, setNotifResponse] = useState(() => localStorage.getItem("notif-new-response") !== "false");
  const [notifEvent, setNotifEvent] = useState(() => localStorage.getItem("notif-new-event") !== "false");
  const [notifComments, setNotifComments] = useState(() => localStorage.getItem("notif-comments") !== "false");
  const saveNotif = (key: string, v: boolean) => localStorage.setItem(key, String(v));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Settings" description="Account, appearance, and preferences." />

      <div className="mt-4 rounded-2xl border border-border bg-card">

        {/* Account */}
        <div className="px-5 py-4">
          <SectionTitle>Account</SectionTitle>
          <div className="space-y-0 text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">
                {user?.roles?.map((r) => r.replace(/_/g, " ")).join(", ") ?? "—"}
              </span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={openProfile}>
              <Pencil className="size-3.5" /> Edit profile
            </Button>
            <Button size="sm" variant="danger" onClick={logout}>
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </div>

        <Divider />

        {/* Appearance */}
        <div className="px-5 py-4">
          <SectionTitle>Appearance</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => isDark && toggleDark()}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all ${!isDark ? "border-brand-green bg-brand-green/5 text-brand-green" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
            >
              <Sun className="size-4" /> Light
            </button>
            <button
              type="button"
              onClick={() => !isDark && toggleDark()}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all ${isDark ? "border-brand-green bg-brand-green/5 text-brand-green" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
            >
              <Moon className="size-4" /> Dark
            </button>
          </div>
        </div>

        <Divider />

        {/* Notifications */}
        <div className="px-5 py-4">
          <SectionTitle>Notifications</SectionTitle>
          <ToggleRow label="New survey responses" checked={notifResponse}
            onChange={(v) => { setNotifResponse(v); saveNotif("notif-new-response", v); }} />
          <ToggleRow label="New events published" checked={notifEvent}
            onChange={(v) => { setNotifEvent(v); saveNotif("notif-new-event", v); }} />
          <ToggleRow label="Comment moderation alerts" checked={notifComments}
            onChange={(v) => { setNotifComments(v); saveNotif("notif-comments", v); }} />
        </div>

        <Divider />

        {/* Security */}
        <div className="px-5 py-4">
          <SectionTitle>Security</SectionTitle>
          <Button size="sm" variant="outline" onClick={() => { setPw({ current: "", next: "", confirm: "" }); setPwOpen(true); }}>
            <Lock className="size-3.5" /> Change password
          </Button>
        </div>

      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="size-4" /> Edit Profile
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" type="email" value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="default" size="sm" loading={profilePending} disabled={profilePending} onClick={saveProfile}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Dialog ── */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-4" /> Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pw-cur">Current password</Label>
              <Input id="pw-cur" type="password" autoComplete="current-password"
                value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pw-new">New password</Label>
              <Input id="pw-new" type="password" autoComplete="new-password"
                value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pw-conf">Confirm new password</Label>
              <Input id="pw-conf" type="password" autoComplete="new-password"
                value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="default" size="sm" loading={pwPending} disabled={pwPending} onClick={changePassword}>
              Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
