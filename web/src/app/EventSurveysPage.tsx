import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Clock, QrCode } from "lucide-react";
import { useEvent } from "@/features/events/hooks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QrModal } from "@/components/qr/QrModal";

export default function EventSurveysPage() {
  const { slug } = useParams();
  const { data: event, isLoading } = useEvent(slug);
  const [qrSurvey, setQrSurvey] = useState<{ title: string; token: string } | null>(null);

  if (isLoading) {
    return (
      <div className="container-page section-y">
        <Skeleton className="h-8 w-1/3" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container-page section-y">
        <h1 className="font-display text-3xl font-bold">Event not found</h1>
        <Link to="/events" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-red">
          <ArrowLeft className="size-4" /> Back to events
        </Link>
      </div>
    );
  }

  const surveys = event.surveys ?? [];

  return (
    <section className="container-page section-y">
      <Link to={`/events/${event.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to {event.title}
      </Link>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Your voice matters</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Surveys for this event
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {event.title} has {surveys.length} active survey{surveys.length !== 1 ? "s" : ""}. Pick one and share your voice.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {surveys.map((s) => (
          <Card key={s.id} className="flex flex-col gap-0 overflow-hidden rounded-3xl border border-border p-0 shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex flex-1 flex-col p-7">
              <div className="flex items-start justify-between gap-2">
                <Badge tone="accent">Open now</Badge>
                {s.qr_token && (
                  <button
                    type="button"
                    onClick={() => setQrSurvey({ title: s.title, token: s.qr_token! })}
                    className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                    aria-label="Show QR code"
                  >
                    <QrCode className="size-5" />
                  </button>
                )}
              </div>

              <h3 className="mt-4 font-display text-2xl font-bold leading-snug">{s.title}</h3>
              {s.description && (
                <p className="mt-3 flex-1 text-base leading-relaxed text-muted-foreground">{s.description}</p>
              )}

              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" />
                <span>Takes about 1–2 minutes</span>
              </div>

              <Link
                to={`/surveys/${s.slug}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand-green/90 hover:-translate-y-0.5 active:translate-y-0"
              >
                Take this survey <ArrowUpRight className="size-5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {qrSurvey && (
        <QrModal
          open={!!qrSurvey}
          onClose={() => setQrSurvey(null)}
          url={`${(import.meta.env.VITE_API_BASE as string)?.replace("/api/v1", "")}/q/${qrSurvey.token}`}
          title={qrSurvey.title}
          subtitle="Scan to take this survey"
        />
      )}
    </section>
  );
}
