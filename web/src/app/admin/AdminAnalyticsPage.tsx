import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { TrendChart } from "@/components/admin/TrendChart";
import { useAnalyticsOverview, useAnalyticsSeries } from "@/features/analytics/hooks";
import { CalendarDays, ClipboardList, MessageSquare, QrCode, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useAnalyticsOverview();
  const { data: scans } = useAnalyticsSeries("qr_scans", "30d");
  const { data: responses } = useAnalyticsSeries("survey_responses", "30d");
  const { data: comments } = useAnalyticsSeries("comments", "30d");

  return (
    <div>
      <PageHeader title="Analytics" description="Engagement metrics and conversion funnels." />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Events" value={data.totals.events} icon={CalendarDays} accent="yellow" />
            <KpiCard label="Survey responses" value={data.totals.survey_responses} icon={ClipboardList} accent="green" />
            <KpiCard label="QR scans" value={data.totals.qr_scans} icon={QrCode} />
            <KpiCard label="Comments" value={data.totals.comments} icon={MessageSquare} accent="red" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion · QR scan → submit</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="font-display text-4xl font-bold">{(data.conversion.qr_to_submit * 100).toFixed(1)}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Scans that resulted in a survey response.</p>
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Survey completion rate</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="font-display text-4xl font-bold">{(data.conversion.survey_completion * 100).toFixed(1)}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Started → finished surveys.</p>
              </div>
            </Card>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>QR scans</CardTitle></CardHeader>
          <div className="px-2 pb-4"><TrendChart data={scans ?? []} color="#D6B452" /></div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Survey responses</CardTitle></CardHeader>
          <div className="px-2 pb-4"><TrendChart data={responses ?? []} color="#018402" /></div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
          <div className="px-2 pb-4"><TrendChart data={comments ?? []} color="#FB110A" /></div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle><BarChart3 className="mr-2 inline size-4" /> Members</CardTitle></CardHeader>
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Total masterlist members: <span className="font-semibold text-foreground">{data?.totals.masterlist ?? 0}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
