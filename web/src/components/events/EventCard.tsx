import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, MapPin, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EventStatusBadge } from "./EventStatusBadge";
import { QrModal } from "@/components/qr/QrModal";
import { formatDateTime } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { EventItem } from "@/types/domain";

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const [showQr, setShowQr] = useState(false);
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [lifted, setLifted] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 … 0.5
    const cy = (e.clientY - rect.top)  / rect.height - 0.5;
    setTilt({ x: cy * 9, y: -cx * 9 }); // max ±9 deg
    setLifted(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setLifted(false);
  };

  return (
    <>
      <Card
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group overflow-hidden"
        style={
          reduced
            ? undefined
            : {
                transform: lifted
                  ? `perspective(1600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
                  : "perspective(1600px) rotateX(0deg) rotateY(0deg) scale(1)",
                transition: lifted
                  ? "transform 0.08s linear, box-shadow 0.3s ease"
                  : "transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1), box-shadow 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)",
                boxShadow: lifted
                  ? "0 16px 40px -12px rgba(17,24,39,0.18), 0 4px 12px rgba(17,24,39,0.1)"
                  : undefined,
                willChange: "transform",
              }
        }
      >
        <Link to={`/events/${event.slug}`} className="block">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
            {event.cover_url ? (
              <img
                src={event.cover_url}
                alt={event.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-slow ease-soft group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Calendar className="size-10" aria-hidden />
              </div>
            )}
            <div className="absolute left-4 top-4">
              <EventStatusBadge status={event.status} />
            </div>
            {event.qr_token && (
              <button
                type="button"
                aria-label="Show QR code"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQr(true); }}
                className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/95 shadow-md ring-1 ring-black/10 transition-all hover:bg-white"
              >
                <QrCode className="size-4 text-foreground" />
              </button>
            )}
          </div>

          {/* Content — sits above card base in 3-D perspective */}
          <div
            className="space-y-3 p-6"
            style={
              reduced
                ? undefined
                : {
                    transform: lifted
                      ? `perspective(1600px) translate3d(0, 0, 30px)`
                      : "perspective(1600px) translate3d(0, 0, 0)",
                    transition: lifted
                      ? "transform 0.08s linear"
                      : "transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)",
                  }
            }
          >
            <h3 className="line-clamp-2 text-xl font-semibold leading-tight">
              {event.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {event.description}
            </p>

            <div className="space-y-1.5 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" aria-hidden />
                <span>{formatDateTime(event.starts_at)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" aria-hidden />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 text-sm font-medium text-foreground">
              <span>View details</span>
              <ArrowUpRight className="size-4 transition-transform duration-base ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </Link>
      </Card>

      {event.qr_token && (
        <QrModal
          open={showQr}
          onClose={() => setShowQr(false)}
          url={`${(import.meta.env.VITE_API_BASE as string)?.replace("/api/v1", "")}/q/${event.qr_token}`}
          title={event.title}
          subtitle="Scan to view this event"
        />
      )}
    </>
  );
}
