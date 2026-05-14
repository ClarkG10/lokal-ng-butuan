import { useState } from "react";
import { Search, MoreHorizontal, Pencil, Trash2, Plus, Mail, Send, MessageCircle, Link2, Check, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAnnouncements, useDeleteAnnouncement, type AnnouncementItem } from "@/features/announcements/hooks";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AnnouncementEditor } from "./AnnouncementEditor";
import { toast } from "@/components/ui/toaster";
import { formatDateTime } from "@/lib/utils";

/* ---------- Broadcast modal ---------- */
function BroadcastModal({ item, onClose }: { item: AnnouncementItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = `${window.location.origin}/announcements/${item.slug}`;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(item.title);
  const mailBody = encodeURIComponent(
    `${item.excerpt ? item.excerpt + "\n\n" : ""}Read the full announcement: ${pageUrl}`,
  );

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openMessenger = async () => {
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.href = `fb-messenger://share/?link=${encodedUrl}`;
    } else {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-xl font-bold">Broadcast Announcement</h2>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.title}</p>

        <div className="mt-5 space-y-3">
          {/* Copy link row */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{pageUrl}</span>
            <button
              type="button"
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium shadow-sm border border-border hover:bg-muted transition-colors"
            >
              {copied ? <Check className="size-3 text-brand-green" /> : <Link2 className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Channel buttons */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedTitle}&body=${mailBody}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium transition-colors hover:bg-surface hover:border-brand-red hover:text-brand-red"
            >
              <Mail className="size-4" />
              Email
            </a>
            <a
              href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium transition-colors hover:bg-[#229ED9]/10 hover:border-[#229ED9] hover:text-[#229ED9]"
            >
              <Send className="size-4" />
              Telegram
            </a>
            <button
              type="button"
              onClick={openMessenger}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium transition-colors hover:bg-[#0084FF]/10 hover:border-[#0084FF] hover:text-[#0084FF]"
            >
              <MessageCircle className="size-4" />
              Messenger
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Messenger opens the app on mobile. On desktop, click Messenger to copy the link — paste it in Messenger.
        </p>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
/* ------------------------------------- */

export default function AdminAnnouncementsPage() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id?: number } | null>(null);
  const [broadcasting, setBroadcasting] = useState<AnnouncementItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { data, isLoading } = useAnnouncements({ q });
  const del = useDeleteAnnouncement();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = (data?.length ?? 0) > 0 && selectedIds.size === (data?.length ?? 0);
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(data?.map((a) => a.id) ?? []));

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} announcement(s)?`)) return;
    setBulkDeleting(true);
    const results = await Promise.allSettled([...selectedIds].map((id) => del.mutateAsync(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkDeleting(false);
    setSelectedIds(new Set());
    if (failed > 0) toast({ title: `${failed} deletion(s) failed`, variant: "error" });
    else toast({ title: `Deleted ${selectedIds.size} announcements`, variant: "success" });
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Share church-wide updates."
        actions={<Button variant="default" onClick={() => setEditing({})}><Plus className="size-4" /> New</Button>}
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-2.5">
            <span className="flex-1 text-sm font-medium">{selectedIds.size} selected</span>
            <Button variant="danger" size="sm" loading={bulkDeleting} disabled={bulkDeleting} onClick={handleBulkDelete}>
              <Trash2 className="size-4" /> Delete {selectedIds.size} selected
            </Button>
            <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setSelectedIds(new Set())}>Cancel</button>
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 cursor-pointer" aria-label="Select all" />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.length ?? 0) === 0 ? (
                  <TableEmpty colSpan={4}>No announcements yet.</TableEmpty>
                ) : (
                  data!.map((a) => (
                    <TableRow key={a.id} className={selectedIds.has(a.id) ? "bg-muted" : ""}>
                      <TableCell>
                        <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} className="size-4 cursor-pointer" aria-label={`Select ${a.title}`} />
                      </TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>
                        <Badge tone={a.status === "published" ? "ongoing" : "neutral"}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.published_at ? formatDateTime(a.published_at) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.expires_at ? formatDateTime(a.expires_at) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing({ id: a.id })}>
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBroadcasting(a)}>
                              <Radio className="size-4" /> Broadcast
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-brand-red"
                              disabled={deletingId === a.id}
                              onClick={async () => {
                                if (!confirm(`Delete "${a.title}"?`)) return;
                                setDeletingId(a.id);
                                try {
                                  await del.mutateAsync(a.id);
                                  toast({ title: "Deleted", variant: "success" });
                                } catch {
                                  toast({ title: "Delete failed", variant: "error" });
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                            >
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {editing !== null && (
        <AnnouncementEditor
          announcementId={editing.id}
          onClose={() => setEditing(null)}
        />
      )}

      {broadcasting !== null && (
        <BroadcastModal item={broadcasting} onClose={() => setBroadcasting(null)} />
      )}
    </div>
  );
}
