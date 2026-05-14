import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AnnouncementItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  expires_at: string | null;
  category?: { id: number; name: string; slug: string } | null;
}

export interface AnnouncementDetail extends AnnouncementItem {
  body_rich: string | null;
}

export function useAnnouncements(params: { status?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ["announcements", "list", params],
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const { data } = await api.get<{ data: AnnouncementItem[] }>("/announcements", { params });
      return data.data;
    },
  });
}

export function useAnnouncement(slug?: string) {
  return useQuery({
    queryKey: ["announcements", "detail", slug],
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 min
    queryFn: async () => {
      const { data } = await api.get<{ data: AnnouncementDetail }>(`/announcements/${slug}`);
      return data.data;
    },
  });
}

export interface AnnouncementInput {
  title: string;
  slug?: string;
  excerpt?: string;
  body_rich?: string;
  status?: "draft" | "published";
  published_at?: string | null;
  expires_at?: string | null;
  category_id?: number | null;
}

export function useSaveAnnouncement(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      const { data } = id
        ? await api.put<{ data: AnnouncementDetail }>(`/admin/announcements/${id}`, input)
        : await api.post<{ data: AnnouncementDetail }>("/admin/announcements", input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/announcements/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useAdminAnnouncement(id?: number) {
  return useQuery({
    queryKey: ["announcements", "admin", id],
    enabled: !!id,
    staleTime: 0,
    queryFn: async () => {
      const { data } = await api.get<{ data: AnnouncementDetail }>(`/admin/announcements/${id}`);
      return data.data;
    },
  });
}
