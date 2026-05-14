import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type SurveyStatus = "draft" | "active" | "closed";
export type QuestionType =
  | "short_text" | "long_text" | "single_choice" | "multi_choice"
  | "rating" | "email" | "phone" | "consent";

export interface SurveyQuestion {
  id: number;
  step: number;
  sort_order: number;
  type: QuestionType;
  label: string;
  help_text?: string | null;
  options?: string[] | null;
  is_required: boolean;
  visibility_rules?: { when: number; op: "equals" | "in" | "not_in"; value: unknown } | null;
}

export interface SurveyDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  status: SurveyStatus;
  qr_token: string | null;
  event_id?: number | null;
  event?: {
    id: number;
    title: string;
    description: string;
    starts_at: string;
    ends_at: string;
    location?: string | null;
    cover_url?: string | null;
  } | null;
  questions: SurveyQuestion[];
}

export const surveyKeys = {
  all: ["surveys"] as const,
  list: () => ["surveys", "list"] as const,
  adminList: () => ["surveys", "admin-list"] as const,
  adminDetail: (id: number) => ["surveys", "admin", id] as const,
  detail: (slug: string) => ["surveys", "detail", slug] as const,
  responses: (id: number) => ["surveys", "responses", id] as const,
};

export function useAdminSurveyDetail(id?: number) {
  return useQuery({
    queryKey: surveyKeys.adminDetail(id ?? 0),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ data: SurveyDetail }>(`/admin/surveys/${id}`);
      return data.data;
    },
  });
}

export function useAdminSurveys() {
  return useQuery({
    queryKey: surveyKeys.adminList(),
    queryFn: async () => {
      const { data } = await api.get<{ data: SurveyDetail[] }>("/admin/surveys");
      return data.data;
    },
  });
}

export interface SurveyAnswer {
  question_id: number;
  question_label: string;
  question_type: string;
  value: unknown; // raw array for multi_choice, {v: ...} for others
}

export interface SurveyResponse {
  id: number;
  submitted_at: string | null;
  via_qr: boolean;
  user_agent: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  respondent: {
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    belongs_to?: string | null;
    purok?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  answers: SurveyAnswer[];
}

export function useSurveyResponses(surveyId?: number) {
  return useQuery({
    queryKey: surveyKeys.responses(surveyId ?? 0),
    enabled: !!surveyId,
    queryFn: async () => {
      const { data } = await api.get<{ data: SurveyResponse[] }>(`/admin/surveys/${surveyId}/responses`);
      return data.data;
    },
  });
}

export function useSurveys() {
  return useQuery({
    queryKey: surveyKeys.list(),
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const { data } = await api.get<{ data: SurveyDetail[] }>("/surveys");
      return data.data;
    },
  });
}

export function useSurvey(slug?: string) {
  return useQuery({
    queryKey: surveyKeys.detail(slug ?? ""),
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<{ data: SurveyDetail }>(`/surveys/${slug}`);
      return data.data;
    },
  });
}

export interface SurveyInput {
  title: string;
  slug?: string;
  description?: string;
  status?: SurveyStatus;
  event_id?: number | null;
  questions: Array<Omit<SurveyQuestion, "id"> & { id?: number }>;
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SurveyInput) => {
      const { data } = await api.post<{ data: SurveyDetail }>("/admin/surveys", input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.all }),
  });
}

export function useUpdateSurvey(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<SurveyInput>) => {
      const { data } = await api.patch<{ data: SurveyDetail }>(`/admin/surveys/${id}`, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.all }),
  });
}

export function useQuickStatusUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: SurveyStatus }) => {
      const { data } = await api.patch<{ data: SurveyDetail }>(`/admin/surveys/${id}`, { status });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.all }),
  });
}

export function useDeleteSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/surveys/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.all }),
  });
}

export function useSubmitSurvey(id: number) {
  return useMutation({
    mutationFn: async (input: {
      answers: Record<number, unknown>;
      respondent?: {
        first_name: string;
        middle_name?: string;
        last_name: string;
        belongs_to: "Binhi" | "Kadiwa" | "Buklod";
        purok: string;
        email?: string;
        phone?: string;
        record_for_campaign?: boolean;
      };
      via_qr?: boolean;
      latitude?: number | null;
      longitude?: number | null;
      location_name?: string | null;
    }) => {
      const { data } = await api.post(`/surveys/${id}/responses`, input);
      return data.data;
    },
  });
}
