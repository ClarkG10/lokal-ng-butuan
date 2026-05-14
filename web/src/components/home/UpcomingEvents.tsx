import { Link } from "react-router-dom";
import { Reveal } from "@/components/motion/Reveal";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LangText } from "@/components/ui/LangText";
import { ArrowRight } from "lucide-react";
import { useEvents } from "@/features/events/hooks";

export function UpcomingEvents() {
  const { data, isLoading } = useEvents({ status: "upcoming", per_page: 3 });

  return (
    <section className="section-y">
      <div className="container-page">
        <Reveal className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <LangText en="What's next" tl="Mga Susunod na Gawain" />
            </p>
            <h2 className="text-display mt-2 font-display font-bold">
              <LangText en="Upcoming events" tl="Mga Paparating na Gawain" />
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              <LangText
                en="Mark your calendar. Save your seat. Bring a friend."
                tl="Itala sa kalendaryo. I-reserba ang iyong lugar. Magdala ng kaibigan."
              />
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/events">
              <LangText en="View all" tl="Tingnan lahat" /> <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))
            : (data?.length ?? 0) === 0
            ? (
              <div className="col-span-3 grid place-items-center rounded-3xl border border-dashed border-border bg-surface p-12 text-center">
                <p className="text-muted-foreground">
                  <LangText en="No upcoming events. Check back soon!" tl="Wala pang paparating na gawain. Bumalik sa susunod!" />
                </p>
              </div>
            )
            : data!.map((event, i) => (
                <Reveal key={event.id} delay={i * 0.05}>
                  <EventCard event={event} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}

