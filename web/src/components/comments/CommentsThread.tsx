import { useState } from "react";
import { useComments, usePostComment } from "@/features/comments/hooks";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";

export function CommentsThread({
  commentableType,
  commentableId,
}: { commentableType: string; commentableId: number }) {
  const { data, isLoading } = useComments({
    commentable_type: commentableType,
    commentable_id: commentableId,
    status: "approved",
  });
  const post = usePostComment();
  const [form, setForm] = useState({ author_name: "", author_email: "", body: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.body.trim() || !form.author_name.trim()) return;
    try {
      await post.mutateAsync({
        commentable_type: commentableType,
        commentable_id: commentableId,
        author_name: form.author_name,
        author_email: form.author_email || undefined,
        body: form.body,
      });
      toast({ title: "Thanks!", description: "Your comment is awaiting moderation.", variant: "success" });
      setForm({ ...form, body: "" });
    } catch {
      toast({ title: "Couldn't post comment", variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="author_name">Name</Label>
              <Input id="author_name" required value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="author_email">Email (optional)</Label>
              <Input id="author_email" type="email" value={form.author_email} onChange={(e) => setForm({ ...form, author_email: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="body">Comment</Label>
            <Textarea id="body" rows={3} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={post.isPending}>Post comment</Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Be the first to share a thought.</p>
      ) : (
        <ul className="space-y-3">
          {data!.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{c.author_name}</p>
                {c.is_pinned && <Badge tone="accent">Pinned</Badge>}
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
