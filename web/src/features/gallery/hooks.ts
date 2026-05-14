import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface GalleryItemData {
  id: number;
  path: string;
  url: string;
  caption: string | null;
  sort_order: number;
  uploaded_by: number | null;
  created_at: string;
  updated_at: string;
}

export const galleryKeys = {
  all: ["gallery"] as const,
  list: () => ["gallery", "list"] as const,
};

/* Public — long staleTime since gallery changes infrequently */
export function useGallery() {
  return useQuery({
    queryKey: galleryKeys.list(),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<{ data: GalleryItemData[] }>("/gallery");
      return data.data;
    },
  });
}

/* Admin — shorter staleTime so changes are reflected promptly */
export function useAdminGallery() {
  return useQuery({
    queryKey: ["gallery", "admin"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.get<{ data: GalleryItemData[] }>("/admin/gallery");
      return data.data;
    },
  });
}

export function useUploadGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<{ data: GalleryItemData }>("/admin/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useUpdateGalleryCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, caption }: { id: number; caption: string }) => {
      const { data } = await api.patch<{ data: GalleryItemData }>(`/admin/gallery/${id}`, { caption });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useDeleteGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/gallery/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useReorderGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await api.patch("/admin/gallery-reorder", { ids });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}
