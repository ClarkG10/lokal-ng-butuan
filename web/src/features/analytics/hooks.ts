import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AnalyticsOverview {
  totals: {
    events: number;
    upcoming_events: number;
    surveys: number;
    survey_responses: number;
    comments: number;
    pending_comments: number;
    approved_comments: number;
    qr_scans: number;
    masterlist: number;
  };
  conversion: {
    qr_to_submit: number;
    survey_completion: number;
  };
  top_surveys: Array<{ id: number; title: string; responses: number }>;
  top_events: Array<{ id: number; title: string; scans: number }>;
  recent_activity: Array<{
    id: number;
    event_type: string;
    occurred_at: string;
    meta?: Record<string, unknown>;
  }>;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const { data } = await api.get<{ data: AnalyticsOverview }>("/admin/analytics/overview");
      return data.data;
    },
  });
}

export function useAnalyticsSeries(
  metric: string,
  range: "7d" | "30d" | "90d" = "30d",
  filters?: { event_id?: number; survey_id?: number },
) {
  return useQuery({
    queryKey: ["analytics", "series", metric, range, filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: SeriesPoint[] }>("/admin/analytics/series", {
        params: { metric, range, ...filters },
      });
      return data.data;
    },
  });
}
