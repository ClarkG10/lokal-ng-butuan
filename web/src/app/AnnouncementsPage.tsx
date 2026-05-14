import type React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAnnouncements } from "@/features/announcements/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { LangText } from "@/components/ui/LangText";

export default function AnnouncementsPage() {
  const { data, isLoading } = useAnnouncements({ status: "published" });

  return (
    <section className="container-page section-y">
      <div className="pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
          <LangText en="Announcements" tl="Mga Anunsyo" />
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
          <LangText en="City-wide updates." tl="Mga balita para sa lahat." />
        </h1>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="py-6 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-surface p-16 text-center">
          <p className="text-muted-foreground">
            <LangText en="No announcements yet. Check back soon." tl="Wala pang anunsyo. Bumalik ulit mamaya." />
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {data!.map((item, i) => (
            <Link
              key={item.id}
              to={`/announcements/${item.slug}`}
              className="group flex items-start justify-between gap-6 py-7 transition-colors"
              style={{
                animation: "stagger-entry 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
                animationDelay: `${i * 0.07}s`,
              } as React.CSSProperties}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  {item.category && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                      {item.category.name}
                    </span>
                  )}
                  {item.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.published_at)}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-xl font-bold leading-snug transition-colors group-hover:text-brand-red">
                  {item.title}
                </h2>
                {item.excerpt && (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {item.excerpt}
                  </p>
                )}
              </div>
              <ArrowRight className="mt-1 size-5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-brand-red" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
