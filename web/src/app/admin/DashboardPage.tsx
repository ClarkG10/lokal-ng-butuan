import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/admin/KpiCard";
import { TrendChart } from "@/components/admin/TrendChart";
import { PageHeader } from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import { useAnalyticsOverview, useAnalyticsSeries } from "@/features/analytics/hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CalendarDays, ClipboardList, Flag, MessageSquare, QrCode, Users } from "lucide-react";

type Range = "7d" | "30d" | "90d";

function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.5">
      {(["7d", "30d", "90d"] as Range[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            value === r
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: overview, isLoading } = useAnalyticsOverview();

  const [scansRange, setScansRange] = useState<Range>("30d");
  const [responsesRange, setResponsesRange] = useState<Range>("30d");
  const [commentsRange, setCommentsRange] = useState<Range>("30d");
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>();
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | undefined>();

  const { data: scansSeries } = useAnalyticsSeries(
    "qr_scans",
    scansRange,
    selectedEventId ? { event_id: selectedEventId } : undefined,
  );
  const { data: responsesSeries } = useAnalyticsSeries(
    "survey_responses",
    responsesRange,
    selectedSurveyId ? { survey_id: selectedSurveyId } : undefined,
  );
  const { data: commentsSeries } = useAnalyticsSeries("comments", commentsRange);

  // Lists for filter comboboxes
  const { data: eventsData } = useQuery({
    queryKey: ["events", "list-for-filter"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Array<{ id: number; title: string }> }>("/admin/events", {
        params: { per_page: 50 },
      });
      return data.data;
    },
  });
  const { data: surveysData } = useQuery({
    queryKey: ["surveys", "list-for-filter"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Array<{ id: number; title: string }> }>("/admin/surveys", {
        params: { per_page: 50 },
      });
      return data.data;
    },
  });

  const eventOptions = (eventsData ?? []).map((e) => ({ value: String(e.id), label: e.title }));
  const surveyOptions = (surveysData ?? []).map((s) => ({ value: String(s.id), label: s.title }));

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of activity across your community." />

      {isLoading || !overview ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="Upcoming events" value={overview.totals.upcoming_events} icon={CalendarDays} accent="yellow" />
          <KpiCard label="Survey responses" value={overview.totals.survey_responses} icon={ClipboardList} accent="green" />
          <KpiCard label="QR scans" value={overview.totals.qr_scans} icon={QrCode} accent="neutral" />
          <KpiCard label="Masterlist members" value={overview.totals.masterlist} icon={Users} accent="yellow" />
          <KpiCard label="Pending comments" value={overview.totals.pending_comments} icon={Flag} accent="red" />
          <KpiCard label="All comments" value={overview.totals.comments} icon={MessageSquare} accent="neutral" />
        </div>
      )}

      {/* Top Lists */}
      {overview && (overview.top_events.length > 0 || overview.top_surveys.length > 0) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {overview.top_events.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Top events by QR scans</CardTitle></CardHeader>
              <div className="divide-y divide-border pb-2">
                {overview.top_events.map((e, i) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 px-6 py-2.5 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>
                      <span className="truncate">{e.title}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{e.scans} scans</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {overview.top_surveys.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Top surveys by responses</CardTitle></CardHeader>
              <div className="divide-y divide-border pb-2">
                {overview.top_surveys.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 px-6 py-2.5 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>
                      <span className="truncate">{s.title}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{s.responses} responses</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <CardTitle>QR scans</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Combobox
                options={eventOptions}
                value={selectedEventId ? String(selectedEventId) : undefined}
                onValueChange={(v) => setSelectedEventId(v ? Number(v) : undefined)}
                placeholder="All events"
                searchPlaceholder="Filter by event…"
                clearable
                className="h-7 text-xs w-48"
              />
              <RangeTabs value={scansRange} onChange={setScansRange} />
            </div>
          </CardHeader>
          <div className="px-2 pb-4">
            <TrendChart data={scansSeries ?? []} color="#3b82f6" />
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <CardTitle>Survey responses</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Combobox
                options={surveyOptions}
                value={selectedSurveyId ? String(selectedSurveyId) : undefined}
                onValueChange={(v) => setSelectedSurveyId(v ? Number(v) : undefined)}
                placeholder="All surveys"
                searchPlaceholder="Filter by survey…"
                clearable
                className="h-7 text-xs w-48"
              />
              <RangeTabs value={responsesRange} onChange={setResponsesRange} />
            </div>
          </CardHeader>
          <div className="px-2 pb-4">
            <TrendChart data={responsesSeries ?? []} color="#10b981" />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Comments</CardTitle>
            <RangeTabs value={commentsRange} onChange={setCommentsRange} />
          </CardHeader>
          <div className="px-2 pb-4">
            <TrendChart data={commentsSeries ?? []} color="#8b5cf6" />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <div className="divide-y divide-border">
          {(overview?.recent_activity ?? []).slice(0, 8).map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-4 px-6 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-medium">
                  <MessageSquare className="size-3.5" />
                </span>
                <span className="font-medium">{row.event_type.replaceAll("_", " ")}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(row.occurred_at).toLocaleString()}
              </span>
            </div>
          ))}
          {(!overview || overview.recent_activity.length === 0) && (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
