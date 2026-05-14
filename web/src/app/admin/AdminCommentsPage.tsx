import { useState } from "react";
import type React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/admin/PageHeader";
import { useComments, useModerateComment } from "@/features/comments/hooks";
import { Check, Flag, MessageSquare, Pin, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";

function commentableLabel(type?: string): string {
  if (!type) return "";
  const map: Record<string, string> = {
    "App\\Models\\Event": "Event",
    "App\\Models\\Announcement": "Announcement",
    "App\\Models\\Survey": "Survey",
  };
  return map[type] ?? (type.split("\\").pop() ?? "");
}

const TABS = [
  { value: "pending", label: "Pending", tone: "upcoming" as const },
  { value: "approved", label: "Approved", tone: "ongoing" as const },
  { value: "rejected", label: "Rejected", tone: "cancelled" as const },
  { value: "spam", label: "Spam", tone: "cancelled" as const },
];

export default function AdminCommentsPage() {
  const [status, setStatus] = useState("pending");
  const [actingId, setActingId] = useState<number | null>(null);
  const { data, isLoading } = useComments({ status });
  const moderate = useModerateComment();

  const act = async (id: number, payload: { status?: string; is_pinned?: boolean }) => {
    setActingId(id);
    try {
      await moderate.mutateAsync({ id, ...payload });
      toast({ title: "Updated", variant: "success" });
    } catch {
      toast({ title: "Action failed", variant: "error" });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Comments" description="Moderate community conversations." />

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : (data?.length ?? 0) === 0 ? (
              <Empty
                icon={MessageSquare}
                title="No comments"
                description={`No ${t.label.toLowerCase()} comments yet.`}
              />
            ) : (
              <div className="space-y-3">
                {data!.map((c, i) => (
                  <Card
                    key={c.id}
                    className="p-5"
                    style={{
                      animation: "stagger-entry 0.4s ease both",
                      animationDelay: `${i * 0.05}s`,
                    } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{c.author_name}</p>
                          <Badge tone={t.tone}>{c.status}</Badge>
                          {c.is_pinned && <Badge tone="accent">Pinned</Badge>}
                        </div>
                        {c.commentable_type && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/70">{commentableLabel(c.commentable_type)}</span>
                            {c.commentable_title
                              ? ` — ${c.commentable_title}`
                              : c.commentable_id
                                ? ` #${c.commentable_id}`
                                : ""}
                          </p>
                        )}
                        <p className="mt-2 text-sm leading-relaxed text-foreground">{c.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {c.status !== "approved" && (
                          <Button size="sm" variant="success" disabled={actingId === c.id} onClick={() => act(c.id, { status: "approved" })}>
                            <Check className="size-4" /> Approve
                          </Button>
                        )}
                        {c.status !== "rejected" && (
                          <Button size="sm" variant="secondary" disabled={actingId === c.id} onClick={() => act(c.id, { status: "rejected" })}>
                            <Trash2 className="size-4" /> Reject
                          </Button>
                        )}
                        {c.status !== "spam" && (
                          <Button size="sm" variant="ghost" disabled={actingId === c.id} onClick={() => act(c.id, { status: "spam" })}>
                            <Flag className="size-4" /> Spam
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" disabled={actingId === c.id} onClick={() => act(c.id, { is_pinned: !c.is_pinned })}>
                          <Pin className="size-4" /> {c.is_pinned ? "Unpin" : "Pin"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
