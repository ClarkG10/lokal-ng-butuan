import { Link } from "react-router-dom";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { LangText } from "@/components/ui/LangText";
import { ArrowRight } from "lucide-react";
import { useGallery } from "@/features/gallery/hooks";

export function CommunityGallery() {
  const { data } = useGallery();
  const items = data?.slice(0, 8) ?? [];

  const showPlaceholders = items.length === 0;

  return (
    <section className="section-y">
      <div className="container-page">
        <Reveal className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">
              <LangText en="Moments" tl="Mga Sandali" />
            </p>
            <h2 className="text-display mt-2 font-display font-bold">
              <LangText en="Community gallery" tl="Galeria ng komunidad" />
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">
              <LangText
                en="Glimpses from recent gatherings — worship, service, and shared moments."
                tl="Mga sulyap mula sa mga nakaraang pagtitipon — pagsamba, paglilingkod, at mga pinagsamang sandali."
              />
            </p>
          </div>
          <Button asChild variant="success">
            <Link to="/gallery">
              <LangText en="View all" tl="Tingnan lahat" /> <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {showPlaceholders
            ? Array.from({ length: 8 }).map((_, i) => (
                <Reveal
                  key={i}
                  delay={i * 0.03}
                  className={
                    i % 5 === 0
                      ? "col-span-2 row-span-2 aspect-square overflow-hidden rounded-2xl bg-muted"
                      : "aspect-square overflow-hidden rounded-xl bg-muted"
                  }
                >
                  <div className="h-full w-full bg-gradient-to-br from-muted to-surface" />
                </Reveal>
              ))
            : items.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={i * 0.03}
                  className={
                    i % 5 === 0
                      ? "col-span-2 row-span-2 aspect-square overflow-hidden rounded-2xl"
                      : "aspect-square overflow-hidden rounded-xl"
                  }
                >
                  <img
                    src={item.url}
                    alt={item.caption ?? "Community photo"}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
