import type React from "react";
import { useState } from "react";
import { useEvents } from "@/features/events/hooks";
import { EventCard } from "@/components/events/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { LangText } from "@/components/ui/LangText";
import { useLang } from "@/contexts/LanguageContext";

export default function EventsPage() {
  const [status, setStatus] = useState<"all" | "upcoming" | "ongoing" | "completed" | "cancelled">("all");
  const { data, isLoading } = useEvents({ status });
  const { lang } = useLang();

  return (
    <section className="container-page section-y">
      <div className="flex flex-col items-start justify-between gap-4 pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
            <LangText en="Events" tl="Mga Gawain" />
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
            <LangText en="Gather, worship, and grow together." tl="Magsama-sama, sumamba, at lumago." />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="status">
            {lang === "tl" ? "Ipakita" : "Show"}
          </label>
          <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-40">
            <option value="all">{lang === "tl" ? "Lahat" : "All"}</option>
            <option value="upcoming">{lang === "tl" ? "Paparating" : "Upcoming"}</option>
            <option value="ongoing">{lang === "tl" ? "Kasalukuyan" : "Ongoing"}</option>
            <option value="completed">{lang === "tl" ? "Tapos na" : "Completed"}</option>
            <option value="cancelled">{lang === "tl" ? "Nakansela" : "Cancelled"}</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-surface p-16 text-center">
          <p className="text-muted-foreground">
            <LangText en="No events found." tl="Walang nakitang gawain." />
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data!.map((event, i) => (
            <div
              key={event.id}
              style={{
                animation: "card-scale-in 0.45s cubic-bezier(0.87, -0.41, 0.19, 1.44) both",
                animationDelay: `${i * 0.06}s`,
              } as React.CSSProperties}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
