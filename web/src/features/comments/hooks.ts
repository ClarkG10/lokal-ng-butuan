import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Comment {
  id: number;
  parent_id: number | null;
  author_name: string;
  body: string;
  status: "pending" | "approved" | "rejected" | "spam";
  is_pinned: boolean;
  created_at: string;
  reactions_count: Record<string, number>;
  replies?: Comment[];
  commentable_type?: string;
  commentable_id?: number;
  commentable_title?: string;
}

export const commentKeys = {
  all: ["comments"] as const,
  list: (params: Record<string, unknown>) => ["comments", "list", params] as const,
};

export function useComments(params: { commentable_type?: string; commentable_id?: number; status?: string } = {}) {
  return useQuery({
    queryKey: commentKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<{ data: Comment[] }>("/comments", { params });
      return data.data;
    },
  });
}

export function usePostComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      commentable_type: string;
      commentable_id: number;
      parent_id?: number;
      author_name: string;
      author_email?: string;
      body: string;
    }) => {
      const { data } = await api.post<{ data: Comment }>("/comments", input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.all }),
  });
}

export function useReact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { commentId: number; type: string }) => {
      const { data } = await api.post(`/comments/${input.commentId}/react`, { type: input.type });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.all }),
  });
}

export function useModerateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; status?: string; is_pinned?: boolean }) => {
      const { data } = await api.patch(`/admin/comments/${input.id}/moderate`, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.all }),
  });
}
