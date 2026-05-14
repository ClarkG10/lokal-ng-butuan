import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAnnouncement, useSaveAnnouncement } from "@/features/announcements/hooks";
import { toast } from "@/components/ui/toaster";

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <span className="flex size-4 cursor-help items-center justify-center rounded-full bg-muted text-[10px] font-bold leading-none text-muted-foreground select-none">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-white p-3 text-xs text-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
        {text}
        <span className="absolute -bottom-[5px] left-1/2 size-[9px] -translate-x-1/2 rotate-45 border-b border-r border-border bg-white" />
      </span>
    </span>
  );
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  body_rich: "",
  status: "draft" as "draft" | "published",
  published_at: "",
  expires_at: "",
};

export function AnnouncementEditor({
  announcementId,
  onClose,
}: { announcementId?: number; onClose: () => void }) {
  const { data: existing, isLoading: loadingExisting } = useAdminAnnouncement(announcementId);
  const save = useSaveAnnouncement(announcementId);
  const [form, setForm] = useState(EMPTY_FORM);

  // Prefill form when editing an existing announcement
  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt ?? "",
        body_rich: existing.body_rich ?? "",
        status: existing.status,
        published_at: existing.published_at
          ? existing.published_at.slice(0, 16) // "YYYY-MM-DDTHH:MM"
          : "",
        expires_at: existing.expires_at
          ? existing.expires_at.slice(0, 10) // "YYYY-MM-DD"
          : "",
      });
    }
  }, [existing]);

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "error" });
      return;
    }
    try {
      await save.mutateAsync({
        title: form.title,
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt || undefined,
        body_rich: form.body_rich || undefined,
        status: form.status,
        published_at:
          form.status === "published"
            ? form.published_at || new Date().toISOString()
            : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      toast({ title: announcementId ? "Announcement updated" : "Announcement created", variant: "success" });
      onClose();
    } catch {
      toast({ title: "Save failed", variant: "error" });
    }
  };

  const isEditing = !!announcementId;

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit announcement" : "New announcement"}</SheetTitle>
          <SheetDescription>Compose a clear, friendly church-wide update.</SheetDescription>
        </SheetHeader>

        {isEditing && loadingExisting ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={f("title")} placeholder="e.g. Community Service Day" />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center">
                Slug (optional)
                <InfoTooltip text="URL-friendly identifier: /announcements/your-slug. Leave blank to auto-generate from the title." />
              </Label>
              <Input value={form.slug} onChange={f("slug")} placeholder="auto-generated" />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center">
                Excerpt
                <InfoTooltip text="Short 1–2 sentence summary shown on the listing page and in notifications. Under 160 characters is best." />
              </Label>
              <Textarea rows={2} value={form.excerpt} onChange={f("excerpt")} placeholder="Brief description…" />
            </div>

            <div className="grid gap-2">
              <Label>Body</Label>
              <Textarea
                rows={12}
                value={form.body_rich}
                onChange={f("body_rich")}
                placeholder="Full announcement content…"
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onChange={f("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>

            {form.status === "published" && (
              <div className="grid gap-2">
                <Label className="flex items-center">
                  Publish date/time
                  <InfoTooltip text="When this announcement becomes visible to the public. Defaults to now if left empty." />
                </Label>
                <Input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={f("published_at")}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label className="flex items-center">
                Expiration date (optional)
                <InfoTooltip text="After this date, the announcement will no longer be shown on the public site. Leave blank to never expire." />
              </Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={f("expires_at")}
              />
              {form.expires_at && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, expires_at: "" }))}
                  className="self-start text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Clear expiration
                </button>
              )}
            </div>
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button variant="default" onClick={submit} disabled={save.isPending || (isEditing && loadingExisting)}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
