import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EventItem } from "@/types/domain";

export interface EventDetail extends EventItem {
  address?: string | null;
  capacity?: number | null;
  requires_registration?: boolean;
  surveys?: Array<{
    id: number;
    slug: string;
    title: string;
    description: string | null;
    qr_token: string | null;
  }>;
  media: Array<{
    id: number;
    url: string;
    orientation: "landscape" | "portrait";
    is_cover: boolean;
    sort_order: number;
    alt_text?: string | null;
  }>;
}

export type EventListFilter = {
  status?: "upcoming" | "ongoing" | "completed" | "cancelled" | "all";
  q?: string;
  per_page?: number;
};

export const eventKeys = {
  all: ["events"] as const,
  list: (filter: EventListFilter) => ["events", "list", filter] as const,
  detail: (slug: string) => ["events", "detail", slug] as const,
  adminList: (filter: EventListFilter) => ["events", "admin", filter] as const,
};

export function useEvents(filter: EventListFilter = {}) {
  return useQuery({
    queryKey: eventKeys.list(filter),
    staleTime: 5 * 60 * 1000, // 5 min — public read-only data
    queryFn: async () => {
      const { data } = await api.get<{ data: EventItem[] }>("/events", { params: filter });
      return data.data;
    },
  });
}

export function useEvent(slug?: string) {
  return useQuery({
    queryKey: eventKeys.detail(slug ?? ""),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 min — event details change rarely
    queryFn: async () => {
      const { data } = await api.get<{ data: EventDetail }>(`/events/${slug}`);
      return data.data;
    },
  });
}

export function useAdminEvent(id?: number) {
  return useQuery({
    queryKey: ["events", "admin", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ data: EventDetail }>(`/admin/events/${id}`);
      return data.data;
    },
  });
}

export interface EventInput {
  title: string;
  slug?: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  address?: string;
  capacity?: number | null;
  requires_registration?: boolean;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  published_at?: string | null;
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { data } = await api.post<{ data: EventDetail }>("/admin/events", input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useUpdateEvent(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EventInput>) => {
      const { data } = await api.patch<{ data: EventDetail }>(`/admin/events/${id}`, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/events/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useUploadEventMedia(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; orientation: "landscape" | "portrait"; alt_text?: string }) => {
      const fd = new FormData();
      fd.append("file", input.file);
      fd.append("orientation", input.orientation);
      if (input.alt_text) fd.append("alt_text", input.alt_text);
      const { data } = await api.post(`/admin/events/${eventId}/media`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useReorderEventMedia(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await api.patch(`/admin/events/${eventId}/media/reorder`, { ids: orderedIds });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useDeleteEventMedia(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: number) => {
      await api.delete(`/admin/events/${eventId}/media/${mediaId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}
