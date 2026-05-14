import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Affiliation = "Binhi" | "Kadiwa" | "Buklod";
export const AFFILIATIONS: Affiliation[] = ["Binhi", "Kadiwa", "Buklod"];

export interface MasterlistRow {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  belongs_to: Affiliation;
  full_name: string;
  email: string | null;
  phone: string | null;
  events_count: number;
  surveys_count: number;
  last_activity_at: string | null;
  source: string | null;
  tags: string[];
}

export interface PaginatedMasterlist {
  data: MasterlistRow[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export function useMasterlist(params: {
  q?: string;
  min_events?: number;
  min_surveys?: number;
  belongs_to?: Affiliation | "";
  page?: number;
} = {}) {
  return useQuery({
    queryKey: ["masterlists", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedMasterlist>("/admin/masterlists", { params });
      return data;
    },
  });
}

export function masterlistExportUrl(params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return `/api/v1/admin/masterlists/export${qs ? `?${qs}` : ""}`;
}

export interface MasterlistSearchResult {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  belongs_to: Affiliation;
  purok: string | null;
  email: string | null;
  phone: string | null;
}

export function useMasterlistSearch(q: string) {
  return useQuery({
    queryKey: ["masterlist-search", q],
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.get<{ data: MasterlistSearchResult[] }>("/masterlists/search", {
        params: { q, per_page: 5 },
      });
      return data.data;
    },
  });
}
