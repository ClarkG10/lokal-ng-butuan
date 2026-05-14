import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Monitor, QrCode, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAdminSurveyDetail, useSurveyResponses, type SurveyResponse } from "@/features/surveys/hooks";
import { formatDateTime } from "@/lib/utils";

function formatValue(type: string, value: unknown): string {
  // multi_choice is stored as a raw array (e.g. ["a","b","c"])
  if (Array.isArray(value)) return (value as string[]).join(", ");
  const obj = value as Record<string, unknown>;
  if (type === "multi_choice") {
    const arr = obj?.v;
    if (Array.isArray(arr)) return arr.join(", ");
    return String(arr ?? "");
  }
  if (type === "consent") return obj?.v ? "Agreed" : "Declined";
  return String(obj?.v ?? "");
}

function parseDevice(ua: string | null): { label: string; icon: "phone" | "desktop" } {
  if (!ua) return { label: "Unknown device", icon: "desktop" };
  const lower = ua.toLowerCase();
  if (/android|iphone|ipad|mobile/.test(lower)) return { label: "Mobile device", icon: "phone" };
  return { label: "Desktop/laptop", icon: "desktop" };
}

function ResponseDrawer({ response, open, onClose }: { response: SurveyResponse | null; open: boolean; onClose: () => void }) {
  if (!response) return null;
  const name = response.respondent
    ? [response.respondent.first_name, response.respondent.middle_name, response.respondent.last_name].filter(Boolean).join(" ")
    : "Anonymous";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{name}</DialogTitle>
          <DialogDescription>
            {response.submitted_at ? formatDateTime(response.submitted_at) : "—"}
            {response.via_qr && <span className="ml-2 inline-flex items-center gap-1 text-xs"><QrCode className="size-3" /> via QR</span>}
          </DialogDescription>
        </DialogHeader>

        {/* Submission context */}
        {(() => {
          const device = parseDevice(response.user_agent);
          const DeviceIcon = device.icon === "phone" ? Smartphone : Monitor;
          return (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <DeviceIcon className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">{device.label}</span>
              {response.location_name && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3" />
                  {response.location_name}
                </span>
              )}
              <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium bg-brand-green/10 text-brand-green">
                {response.via_qr ? "On-site (QR scan)" : "Submitted online"}
              </span>
            </div>
          );
        })()}

        {response.respondent && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
            <div><span className="text-xs text-muted-foreground">Group</span><p className="font-medium">{response.respondent.belongs_to ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground">Email</span><p className="font-medium">{response.respondent.email ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground">Phone</span><p className="font-medium">{response.respondent.phone ?? "—"}</p></div>
          </div>
        )}

        <div className="mt-2 space-y-3">
          {response.answers.map((a) => (
            <div key={a.question_id} className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">{a.question_label}</p>
              <p className="mt-1 text-sm">{formatValue(a.question_type, a.value)}</p>
            </div>
          ))}
          {response.answers.length === 0 && (
            <p className="text-sm text-muted-foreground">No answers recorded.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSurveyResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const surveyId = id ? parseInt(id, 10) : undefined;
  const { data: survey, isLoading: surveyLoading } = useAdminSurveyDetail(surveyId);
  const { data: responses, isLoading: responsesLoading } = useSurveyResponses(surveyId);
  const [selected, setSelected] = useState<SurveyResponse | null>(null);

  const isLoading = surveyLoading || responsesLoading;

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/admin/surveys"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to surveys
        </Link>
      </div>

      <PageHeader
        title={survey ? `Responses — ${survey.title}` : "Survey Responses"}
        description={
          responses
            ? `${responses.length} submission${responses.length !== 1 ? "s" : ""} total`
            : "Loading…"
        }
      />

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Respondent</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Via QR</TableHead>
                <TableHead className="w-20 text-right">Answers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(responses?.length ?? 0) === 0 ? (
                <TableEmpty colSpan={5}>No responses yet.</TableEmpty>
              ) : (
                responses!.map((r) => {
                  const name = r.respondent
                    ? `${r.respondent.first_name} ${r.respondent.last_name}`
                    : "Anonymous";
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                      <TableCell>
                        <p className="font-medium">{name}</p>
                        {r.respondent?.email && (
                          <p className="text-xs text-muted-foreground">{r.respondent.email}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.respondent?.belongs_to ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.submitted_at ? formatDateTime(r.submitted_at) : "—"}
                      </TableCell>
                      <TableCell>
                        {r.via_qr ? (
                          <Badge tone="upcoming"><QrCode className="size-3" /> QR</Badge>
                        ) : (
                          <Badge tone="neutral">Direct</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ResponseDrawer response={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
