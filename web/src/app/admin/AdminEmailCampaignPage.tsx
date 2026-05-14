import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "@/components/ui/toaster";
import { AFFILIATIONS, type Affiliation } from "@/features/masterlists/hooks";
import { Portal } from "@/components/ui/portal";
import {
  Eye,
  Send,
  Users,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Heading2,
  Image,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────── */
interface PreviewData {
  total: number;
  sample: { id: number; full_name: string; email: string; belongs_to: string }[];
}

/* ── Simple Rich-Text Toolbar ─────────────────────────────── */
function RichTextToolbar({ onCommand }: { onCommand: (cmd: string, val?: string) => void }) {
  const tools = [
    { icon: <Bold className="size-3.5" />, cmd: "bold", title: "Bold" },
    { icon: <Italic className="size-3.5" />, cmd: "italic", title: "Italic" },
    { icon: <Underline className="size-3.5" />, cmd: "underline", title: "Underline" },
    { icon: <Heading2 className="size-3.5" />, cmd: "formatBlock", val: "h2", title: "Heading" },
    { icon: <AlignLeft className="size-3.5" />, cmd: "justifyLeft", title: "Align left" },
    { icon: <AlignCenter className="size-3.5" />, cmd: "justifyCenter", title: "Center" },
    { icon: <AlignRight className="size-3.5" />, cmd: "justifyRight", title: "Align right" },
    { icon: <List className="size-3.5" />, cmd: "insertUnorderedList", title: "Bullet list" },
  ];
  return (
    <div className="flex flex-wrap gap-0.5 rounded-t-lg border border-b-0 border-border bg-muted/50 px-2 py-1.5">
      {tools.map(({ icon, cmd, val, title }) => (
        <button
          key={cmd + (val ?? "")}
          type="button"
          title={title}
          onMouseDown={(e) => { e.preventDefault(); onCommand(cmd, val); }}
          className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          {icon}
        </button>
      ))}
      {/* Colour picker shorthand */}
      <button
        type="button"
        title="Text color"
        onMouseDown={(e) => { e.preventDefault(); onCommand("foreColor", "#018402"); }}
        className="rounded px-2 py-1 text-[11px] font-bold text-brand-green hover:bg-background transition-colors"
      >
        A
      </button>
      <button
        type="button"
        title="Insert link"
        onMouseDown={(e) => {
          e.preventDefault();
          const url = window.prompt("Enter URL:");
          if (url) onCommand("createLink", url);
        }}
        className="rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-background transition-colors"
      >
        Link
      </button>
      <button
        type="button"
        title="Insert image URL"
        onMouseDown={(e) => {
          e.preventDefault();
          const url = window.prompt("Enter image URL:");
          if (url) onCommand("insertImage", url);
        }}
        className="rounded p-1.5 text-muted-foreground hover:bg-background transition-colors"
      >
        <Image className="size-3.5" />
      </button>
    </div>
  );
}

/* ── Email Preview Modal ──────────────────────────────────── */
function EmailPreviewModal({
  subject,
  bodyHtml,
  onClose,
}: {
  subject: string;
  bodyHtml: string;
  onClose: () => void;
}) {
  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Email client header mockup */}
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Email Preview</p>
          <p className="text-sm"><span className="font-semibold">From:</span> Lokal ng Butuan City &lt;noreply@lokal.butuan&gt;</p>
          <p className="text-sm"><span className="font-semibold">To:</span> Member &lt;member@email.com&gt;</p>
          <p className="text-sm"><span className="font-semibold">Subject:</span> {subject || "(no subject)"}</p>
        </div>
        <div
          className="max-h-[60vh] overflow-y-auto px-6 py-5 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: bodyHtml || "<p><em>No content yet.</em></p>" }}
        />
        <div className="border-t border-border px-5 py-3 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Close Preview</Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function AdminEmailCampaignPage() {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [filterGroup, setFilterGroup] = useState<Affiliation | "">("");
  const [filterPurok, setFilterPurok] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  /* editor ref */
  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val ?? "");
  };

  /* API hooks */
  const previewMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<PreviewData>("/admin/email-campaigns/preview", {
        belongs_to: filterGroup || undefined,
        purok: filterPurok || undefined,
      });
      return data;
    },
    onSuccess: (d) => setPreviewData(d),
    onError: () => toast({ title: "Failed to load recipients", variant: "error" }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const editor = document.getElementById("email-body") as HTMLElement;
      const html = editor?.innerHTML ?? bodyHtml;
      const { data } = await api.post<{ message: string; sent: number; failed: number }>(
        "/admin/email-campaigns/send",
        {
          subject,
          body_html: html,
          belongs_to: filterGroup || undefined,
          purok: filterPurok || undefined,
        },
      );
      return data;
    },
    onSuccess: (d) =>
      toast({
        title: `Campaign sent — ${d.sent} delivered${d.failed ? `, ${d.failed} failed` : ""}`,
        variant: "success",
      }),
    onError: () => toast({ title: "Failed to send campaign", variant: "error" }),
  });

  const handleSend = () => {
    if (!subject.trim()) { toast({ title: "Subject is required", variant: "error" }); return; }
    const editor = document.getElementById("email-body") as HTMLElement;
    if (!editor?.innerHTML.trim()) { toast({ title: "Email body is empty", variant: "error" }); return; }
    if (!previewData) { toast({ title: "Preview recipients first before sending", variant: "error" }); return; }
    if (window.confirm(`Send to ${previewData.total} recipient(s)?`)) {
      sendMutation.mutate();
    }
  };

  return (
    <div>
      <PageHeader
        title="Email Campaign"
        description="Compose and send a styled email to community members."
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="size-4" /> Preview
            </Button>
            <Button
              variant="default"
              onClick={handleSend}
              disabled={sendMutation.isPending}
              loading={sendMutation.isPending}
            >
              <Send className="size-4" /> Send Campaign
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Left: Compose ── */}
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject line</Label>
              <Input
                id="subject"
                placeholder="e.g. Upcoming Community Event — June 2026"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Email body</Label>
              <RichTextToolbar onCommand={execCmd} />
              <div
                id="email-body"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setBodyHtml((e.currentTarget as HTMLElement).innerHTML)}
                className="min-h-[320px] rounded-b-lg border border-border bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-brand-green/40 prose prose-sm max-w-none"
                style={{ whiteSpace: "pre-wrap" }}
                data-placeholder="Write your email content here…"
              />
              <style>{`
                #email-body:empty:before {
                  content: attr(data-placeholder);
                  color: hsl(var(--muted-foreground));
                  pointer-events: none;
                }
              `}</style>
            </div>
          </Card>
        </div>

        {/* ── Right: Filters + Recipients ── */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <p className="text-sm font-semibold">Recipient Filters</p>

            <div className="space-y-1.5">
              <Label>Belongs To</Label>
              <Select
                value={filterGroup || "all"}
                onChange={(e) =>
                  setFilterGroup(e.target.value === "all" ? "" : (e.target.value as Affiliation))
                }
                className="w-full"
              >
                <option value="all">All affiliations</option>
                {AFFILIATIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Purok / Area</Label>
              <Input
                placeholder="e.g. 3 (optional)"
                value={filterPurok}
                onChange={(e) => setFilterPurok(e.target.value)}
                className="h-9"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending}
              loading={previewMutation.isPending}
            >
              <Users className="size-4" />
              Preview Recipients
            </Button>
          </Card>

          {/* Recipients result */}
          {previewMutation.isPending && (
            <Card className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </Card>
          )}

          {previewData && !previewMutation.isPending && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Recipients</p>
                <Badge tone="upcoming">{previewData.total} total</Badge>
              </div>
              <div className="space-y-1.5">
                {previewData.sample.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs"
                  >
                    <span className="font-medium truncate">{r.full_name}</span>
                    <span className="text-muted-foreground truncate max-w-[120px]">{r.email}</span>
                  </div>
                ))}
                {previewData.total > previewData.sample.length && (
                  <p className="text-center text-xs text-muted-foreground py-1">
                    +{previewData.total - previewData.sample.length} more
                  </p>
                )}
              </div>
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">
                  Only members <span className="font-semibold">with email addresses</span> will receive the email.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showPreview && (
        <EmailPreviewModal
          subject={subject}
          bodyHtml={
            (document.getElementById("email-body") as HTMLElement)?.innerHTML ?? bodyHtml
          }
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
