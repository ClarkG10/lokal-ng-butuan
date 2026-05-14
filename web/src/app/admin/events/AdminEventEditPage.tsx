import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useEvent, useAdminEvent, useCreateEvent, useUpdateEvent, type EventInput } from "@/features/events/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "@/components/ui/toaster";
import { EventMediaManager } from "./EventMediaManager";
import { EventQrPoster } from "./EventQrPoster";

/* CSS-only tooltip — no extra dependencies */
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

const EMPTY: EventInput = {
  title: "",
  description: "",
  starts_at: "",
  ends_at: "",
  location: "",
  address: "",
  capacity: null,
  requires_registration: false,
  status: "upcoming",
};

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEventEditPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = id === "new";
  const numericId = isNew ? undefined : Number(id);
  const navigate = useNavigate();

  const { data: existing } = useAdminEvent(numericId);
  void useEvent;

  const [form, setForm] = useState<EventInput>(EMPTY);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        slug: existing.slug,
        description: existing.description,
        starts_at: existing.starts_at,
        ends_at: existing.ends_at,
        location: existing.location ?? "",
        address: existing.address ?? "",
        capacity: existing.capacity ?? null,
        requires_registration: existing.requires_registration ?? false,
        status: existing.status,
      });
    }
  }, [existing]);

  const create = useCreateEvent();
  const update = useUpdateEvent(numericId ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: EventInput = {
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      };
      if (isNew) {
        const created = await create.mutateAsync(payload);
        toast({ title: "Event created", variant: "success" });
        navigate(`/admin/events/${created.id}`);
      } else {
        await update.mutateAsync(payload);
        toast({ title: "Event saved", variant: "success" });
      }
    } catch {
      toast({ title: "Save failed", description: "Please check the form and try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "New event" : (existing?.title ?? "Edit event")}
        description={isNew ? "Create a new event for your community." : "Update event details, media, and QR."}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link to="/admin/events">
                <ArrowLeft className="size-4" /> Back
              </Link>
            </Button>
            <Button variant="default" form="event-form" type="submit" disabled={create.isPending || update.isPending}>
              <Save className="size-4" />
              {create.isPending ? "Creating…" : update.isPending ? "Saving…" : isNew ? "Create" : "Save changes"}
            </Button>
          </>
        }
      />

      <Tabs defaultValue={searchParams.get("tab") ?? "details"}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media" disabled={isNew}>Media</TabsTrigger>
          <TabsTrigger value="qr" disabled={isNew}>QR Poster</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="p-6 md:p-8">
            <form id="event-form" onSubmit={submit} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug" className="flex items-center">
                  Slug
                  <InfoTooltip text="A slug is the short, URL-friendly identifier for this event: /events/your-slug. Leave blank and the server will auto-generate one from the title. Use only lowercase letters, numbers, and hyphens — no spaces." />
                </Label>
                <Input
                  id="slug"
                  value={form.slug ?? ""}
                  placeholder="auto-generated from title"
                  onChange={(e) => setForm({ ...form, slug: e.target.value || undefined })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={5}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="starts_at">Starts at</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    required
                    value={toLocalInput(form.starts_at)}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ends_at">Ends at</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    required
                    value={toLocalInput(form.ends_at)}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location name</Label>
                  <Input
                    id="location"
                    value={form.location ?? ""}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address ?? ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={0}
                    value={form.capacity ?? ""}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={form.status ?? "upcoming"}
                    onChange={(e) => setForm({ ...form, status: e.target.value as EventInput["status"] })}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Statuses auto-update. Cancelled is sticky.
                  </p>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={form.requires_registration ?? false}
                      onChange={(e) => setForm({ ...form, requires_registration: e.target.checked })}
                    />
                    <span className="text-sm">Requires registration</span>
                  </label>
                </div>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          {numericId && existing && <EventMediaManager event={existing} />}
        </TabsContent>

        <TabsContent value="qr">
          {numericId && existing?.qr_token && (
            <EventQrPoster token={existing.qr_token} title={existing.title} startsAt={existing.starts_at} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
