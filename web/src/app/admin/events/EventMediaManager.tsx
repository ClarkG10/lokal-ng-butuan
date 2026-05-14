import { useRef, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, UploadCloud, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useUploadEventMedia, useReorderEventMedia, useDeleteEventMedia, type EventDetail,
} from "@/features/events/hooks";
import { toast } from "@/components/ui/toaster";

function MediaRow({
  media, deletingId, onDelete,
}: {
  media: EventDetail["media"][number];
  deletingId: number | null;
  onDelete: (id: number) => void;
}) {
  const isDeleting = deletingId === media.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: media.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-opacity ${isDragging || isDeleting ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="grid size-8 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label="Drag to reorder"
        disabled={isDeleting}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {media.url ? (
          <img src={media.url} alt={media.alt_text ?? ""} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{media.alt_text || `Media #${media.id}`}</p>
          {media.is_cover && <Badge tone="upcoming">Cover</Badge>}
        </div>
        <p className="text-xs text-muted-foreground capitalize">{media.orientation}</p>
      </div>
      <Button variant="ghost" size="icon" aria-label="Delete media" disabled={isDeleting} onClick={() => onDelete(media.id)}>
        <Trash2 className="size-4 text-brand-red" />
      </Button>
    </div>
  );
}

export function EventMediaManager({ event }: { event: EventDetail }) {
  const [items, setItems] = useState(event.media);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");

  const upload = useUploadEventMedia(event.id);
  const reorder = useReorderEventMedia(event.id);
  const del = useDeleteEventMedia(event.id);

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    try {
      await reorder.mutateAsync(next.map((i) => i.id));
    } catch {
      toast({ title: "Reorder failed", variant: "error" });
    }
  };

  const onPick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const created = await upload.mutateAsync({ file, orientation });
      setItems([...items, created]);
      toast({ title: "Media uploaded", variant: "success" });
    } catch {
      toast({ title: "Upload failed", variant: "error" });
    } finally {
      e.target.value = "";
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Remove this media?")) return;
    setDeletingId(id);
    try {
      await del.mutateAsync(id);
      setItems(items.filter((i) => i.id !== id));
    } catch {
      toast({ title: "Delete failed", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h3 className="text-base font-semibold">Event media</h3>
          <p className="text-xs text-muted-foreground">Drag to reorder. The first item becomes the cover.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={orientation} onChange={(e) => setOrientation(e.target.value as "landscape" | "portrait")}>
            <option value="landscape">Landscape (16:9)</option>
            <option value="portrait">Portrait (3:4)</option>
          </Select>
          <Button variant="default" onClick={onPick} disabled={upload.isPending}>
            <UploadCloud className="size-4" />
            {upload.isPending ? "Uploading\u2026" : "Upload"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border-2 border-dashed border-border bg-surface py-16 text-center">
          <ImageIcon className="size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No media yet. Upload your first image.</p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((m) => (
                <MediaRow key={m.id} media={m} deletingId={deletingId} onDelete={onDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </Card>
  );
}
