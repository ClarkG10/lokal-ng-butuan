import { Link } from "react-router-dom";
import { useState } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, QrCode } from "lucide-react";
import { useEvents, useDeleteEvent } from "@/features/events/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

export default function AdminEventsPage() {
  const [q, setQ] = useState("");
  const { data: events, isLoading } = useEvents({ q });
  const del = useDeleteEvent();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = (events?.length ?? 0) > 0 && selectedIds.size === (events?.length ?? 0);
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(events?.map((e) => e.id) ?? []));

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} event(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const results = await Promise.allSettled([...selectedIds].map((id) => del.mutateAsync(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkDeleting(false);
    setSelectedIds(new Set());
    if (failed > 0) toast({ title: `${failed} deletion(s) failed`, variant: "error" });
    else toast({ title: `Deleted ${selectedIds.size} events`, variant: "success" });
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(id);
      toast({ title: "Event deleted", variant: "success" });
    } catch {
      toast({ title: "Failed to delete event", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Events"
        description="Create and manage events for your community."
        actions={
          <Button variant="default" asChild>
            <Link to="/admin/events/new">
              <Plus className="size-4" /> New event
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-2.5">
            <span className="flex-1 text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="danger"
              size="sm"
              loading={bulkDeleting}
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
            >
              <Trash2 className="size-4" />
              Delete {selectedIds.size} selected
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="size-4 cursor-pointer accent-brand-green"
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events?.length ?? 0) === 0 ? (
                  <TableEmpty colSpan={8}>No events yet. Create your first one.</TableEmpty>
                ) : (
                  events!.map((event) => (
                    <TableRow key={event.id} className={selectedIds.has(event.id) ? "bg-brand-green/5" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(event.id)}
                          onChange={() => toggleSelect(event.id)}
                          className="size-4 cursor-pointer accent-brand-green"
                          aria-label={`Select ${event.title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/events/${event.id}`} className="font-medium hover:underline">
                          {event.title}
                        </Link>
                      </TableCell>
                      <TableCell><EventStatusBadge status={event.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(event.starts_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(event.ends_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.location ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground" title={event.slug}>
                        /{event.slug}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/events/${event.id}`}>
                                <Pencil className="size-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            {event.qr_token && (
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/events/${event.id}?tab=qr`}>
                                  <QrCode className="size-4" /> QR poster
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(event.id, event.title)}
                              className="text-brand-red"
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
    </div>
  );
}
