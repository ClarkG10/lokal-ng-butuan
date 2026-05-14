import { useRef, useState } from "react";
import { ImagePlus, Trash2, GripVertical, X, Check, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  useAdminGallery,
  useUploadGalleryItem,
  useDeleteGalleryItem,
  useUpdateGalleryCaption,
  useReorderGallery,
  type GalleryItemData,
} from "@/features/gallery/hooks";
import { toast } from "@/components/ui/toaster";

export default function AdminGalleryPage() {
  const { data: items = [], isLoading } = useAdminGallery();
  const upload = useUploadGalleryItem();
  const deleteItem = useDeleteGalleryItem();
  const reorder = useReorderGallery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const updateCaption = useUpdateGalleryCaption();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} photo(s) permanently?`)) return;
    setBulkDeleting(true);
    const results = await Promise.allSettled([...selectedIds].map((id) => deleteItem.mutateAsync(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkDeleting(false);
    setSelectedIds(new Set());
    if (failed > 0) toast({ title: `${failed} deletion(s) failed`, variant: "error" });
    else toast({ title: `Deleted ${selectedIds.size} photos`, variant: "success" });
  };

  // Simple drag-to-reorder state
  const [dragId, setDragId] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<GalleryItemData[]>([]);
  const displayItems = localItems.length > 0 ? localItems : items;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    files.forEach((file) => {
      const fd = new FormData();
      fd.append("image", file);
      upload.mutate(fd, {
        onSuccess: () => toast({ title: `Uploaded ${file.name}`, variant: "success" }),
        onError: () => toast({ title: `Failed to upload ${file.name}`, variant: "error" }),
      });
    });

    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this photo permanently?")) return;
    deleteItem.mutate(id, {
      onSuccess: () => toast({ title: "Photo deleted", variant: "success" }),
      onError: () => toast({ title: "Failed to delete", variant: "error" }),
    });
  }

  function startEditCaption(item: GalleryItemData) {
    setEditingId(item.id);
    setCaptionDraft(item.caption ?? "");
  }

  function commitCaption(id: number) {
    updateCaption.mutate(
      { id, caption: captionDraft },
      {
        onSuccess: () => {
          toast({ title: "Caption saved", variant: "success" });
          setEditingId(null);
        },
        onError: () => toast({ title: "Failed to save caption", variant: "error" }),
      },
    );
  }

  /* ── Drag-to-reorder ── */
  function handleDragStart(id: number) {
    setDragId(id);
    setLocalItems([...items]);
  }

  function handleDragOver(e: React.DragEvent, targetId: number) {
    e.preventDefault();
    if (dragId === null || dragId === targetId) return;

    setLocalItems((prev) => {
      const next = [...prev];
      const from = next.findIndex((i) => i.id === dragId);
      const to = next.findIndex((i) => i.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleDrop() {
    if (!localItems.length) return;
    const ids = localItems.map((i) => i.id);
    reorder.mutate(ids, {
      onSuccess: () => {
        setLocalItems([]);
        setDragId(null);
        toast({ title: "Order saved", variant: "success" });
      },
      onError: () => {
        setLocalItems([]);
        setDragId(null);
        toast({ title: "Failed to save order", variant: "error" });
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Upload and manage community photos shown on the public gallery page."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={handleFileSelect}
            />
            <Button variant="default" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
              <ImagePlus className="size-4" />
              {upload.isPending ? "Uploading…" : "Upload Photos"}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <ImagePlus className="mb-4 size-10 opacity-40" />
          <p className="font-medium">No photos yet</p>
          <p className="mt-1 text-sm">Click "Upload Photos" to add community images.</p>
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {selectedIds.size === 0
              ? "Drag thumbnails to reorder. Changes save automatically on drop."
              : null}
          </p>

          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-2.5">
              <span className="flex-1 text-sm font-medium">{selectedIds.size} selected</span>
              <Button variant="danger" size="sm" loading={bulkDeleting} disabled={bulkDeleting} onClick={handleBulkDelete}>
                <Trash2 className="size-4" /> Delete {selectedIds.size} selected
              </Button>
              <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setSelectedIds(new Set())}>Cancel</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayItems.map((item) => (
              <div
                key={item.id}
                draggable={selectedIds.size === 0}
                onDragStart={() => selectedIds.size === 0 && handleDragStart(item.id)}
                onDragOver={(e) => selectedIds.size === 0 && handleDragOver(e, item.id)}
                onDrop={() => selectedIds.size === 0 && handleDrop()}
                className={`group relative rounded-xl border bg-muted/30 transition-shadow hover:shadow-md ${
                  selectedIds.has(item.id)
                    ? "border-brand-green ring-2 ring-brand-green/40"
                    : "border-border cursor-grab active:cursor-grabbing"
                }`}
              >
                {/* Image */}
                <div
                  className="aspect-square overflow-hidden rounded-t-xl cursor-pointer"
                  onClick={() => toggleSelect(item.id)}
                >
                  <img
                    src={item.url}
                    alt={item.caption ?? "Gallery photo"}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Checkbox overlay (top-left) */}
                <div
                  className={`absolute left-1.5 top-1.5 rounded-md transition-opacity ${
                    selectedIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="size-4 cursor-pointer accent-brand-green shadow"
                    aria-label="Select photo"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Drag handle (only visible when not in selection mode) */}
                {selectedIds.size === 0 && (
                  <div className="pointer-events-none absolute left-1.5 top-7 rounded-md bg-black/40 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="size-3.5 text-white" />
                  </div>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-3.5 text-white" />
                </button>

                {/* Caption editor */}
                <div className="p-2">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        placeholder="Add caption…"
                        className="h-7 flex-1 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitCaption(item.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => commitCaption(item.id)}
                        className="rounded p-0.5 hover:bg-brand-green/20"
                        aria-label="Save"
                      >
                        <Check className="size-3.5 text-brand-green" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded p-0.5 hover:bg-muted"
                        aria-label="Cancel"
                      >
                        <X className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-1 text-left"
                      onClick={() => startEditCaption(item)}
                    >
                      <span className="flex-1 truncate text-xs text-muted-foreground">
                        {item.caption || <span className="italic opacity-60">Add caption…</span>}
                      </span>
                      <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
