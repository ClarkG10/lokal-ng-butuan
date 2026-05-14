import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardList, MapPin, QrCode, Users } from "lucide-react";
import { useEvent } from "@/features/events/hooks";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { formatDateTime } from "@/lib/utils";
import { CommentsThread } from "@/components/comments/CommentsThread";
import { QrModal } from "@/components/qr/QrModal";

export default function EventDetailPage() {
  const { slug } = useParams();
  const { data: event, isLoading } = useEvent(slug);
  const [lightboxMedia, setLightboxMedia] = useState<NonNullable<ReturnType<typeof useEvent>["data"]>["media"][number] | null>(null);
  const [showQr, setShowQr] = useState(false);

  if (isLoading) {
    return (
      <div className="container-page section-y">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="mt-4 h-96 w-full" />
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

  const cover = event.media.find((m) => m.is_cover) ?? event.media[0];

  return (
    <div className="container-page section-y">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to events
      </Link>

      <header className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-3xl bg-muted shadow-sm">
          {cover?.url ? (
            <img src={cover.url} alt={cover.alt_text ?? event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-green/8 to-brand-yellow/8 text-muted-foreground">
              <CalendarDays className="size-14 opacity-30" />
              <span className="text-sm">No cover photo</span>
            </div>
          )}
        </div>

        <Card className="flex flex-col gap-5 p-7 shadow-sm">
          <div>
            <EventStatusBadge status={event.status} />
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{event.title}</h1>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 text-brand-red" />
              <div>
                <p className="font-medium">{formatDateTime(event.starts_at)}</p>
                <p className="text-muted-foreground">until {formatDateTime(event.ends_at)}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-brand-green" />
                <div>
                  <p className="font-medium">{event.location}</p>
                  {event.address && <p className="text-muted-foreground">{event.address}</p>}
                </div>
              </div>
            )}
            {event.capacity && (
              <div className="flex items-center gap-3">
                <Users className="size-4 text-foreground" />
                <p className="font-medium">Capacity: {event.capacity}</p>
              </div>
            )}
          </div>

          {event.description && (
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-sm font-semibold text-muted-foreground mb-1">About this event</p>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* QR + Surveys actions */}
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {event.qr_token && (
              <Button variant="outline" size="sm" onClick={() => setShowQr(true)} className="gap-2">
                <QrCode className="size-4" /> Show QR
              </Button>
            )}
            {(event.surveys?.length ?? 0) === 1 && (
              <Button asChild size="sm" className="gap-2 bg-brand-green text-white hover:bg-brand-green/90">
                <Link to={`/surveys/${event.surveys![0].slug}`}>
                  <ClipboardList className="size-4" /> Take Survey
                </Link>
              </Button>
            )}
            {(event.surveys?.length ?? 0) > 1 && (
              <Button asChild size="sm" className="gap-2 bg-brand-green hover:bg-brand-green/90">
                <Link to={`/events/${event.slug}/surveys`}>
                  <ClipboardList className="size-4" /> {event.surveys!.length} Surveys
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </Card>
      </header>

      {event.media.filter((m) => !m.is_cover).length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Gallery</h2>
          <div className="mt-4 columns-3 gap-x-3 md:columns-4 lg:columns-5">
            {event.media.filter((m) => !m.is_cover).map((m) => (
              <button
                key={m.id}
                type="button"
                className="mb-3 block w-full cursor-zoom-in break-inside-avoid overflow-hidden rounded-xl border border-border bg-surface transition-opacity hover:opacity-90"
                onClick={() => setLightboxMedia(m)}
                aria-label={m.alt_text ?? "View image"}
              >
                <img
                  src={m.url}
                  alt={m.alt_text ?? ""}
                  className={`w-full object-cover ${m.orientation === "portrait" ? "aspect-[3/4]" : "aspect-video"}`}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {lightboxMedia && (
        <ImageLightbox
          src={lightboxMedia.url}
          alt={lightboxMedia.alt_text ?? ""}
          onClose={() => setLightboxMedia(null)}
        />
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Conversation</h2>
        <p className="text-sm text-muted-foreground">Share encouragement and stories with the community.</p>
        <div className="mt-5">
          <CommentsThread commentableType={"App\\Models\\Event"} commentableId={event.id} />
        </div>
      </section>

      {event.qr_token && (
        <QrModal
          open={showQr}
          onClose={() => setShowQr(false)}
          url={`${(import.meta.env.VITE_API_BASE as string)?.replace("/api/v1", "")}/q/${event.qr_token}`}
          title={event.title}
          subtitle="Scan to view this event"
        />
      )}
    </div>
  );
}
