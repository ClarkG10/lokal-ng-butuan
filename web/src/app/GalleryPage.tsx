import type React from "react";
import { useState } from "react";
import { useGallery, type GalleryItemData } from "@/features/gallery/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { LangText } from "@/components/ui/LangText";

const SKELETON_HEIGHTS = [180, 240, 160, 210, 230, 175, 260, 155, 200, 220, 170, 205];

export default function GalleryPage() {
  const { data, isLoading } = useGallery();
  const items = data ?? [];
  const [lightbox, setLightbox] = useState<GalleryItemData | null>(null);

  return (
    <section className="container-page section-y">
      <div className="pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
          <LangText en="Gallery" tl="Galerya" />
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
          <LangText en="Our community moments." tl="Mga sandali ng ating komunidad." />
        </h1>
        <p className="mt-3 text-muted-foreground md:text-lg">
          <LangText
            en="Photos from our events and gatherings."
            tl="Mga larawan mula sa aming mga gawain at pagtitipon."
          />
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {SKELETON_HEIGHTS.map((h, i) => (
            <Skeleton key={i} className="w-full rounded-2xl" style={{ height: `${h}px` }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-surface p-16 text-center">
          <p className="text-muted-foreground">
            <LangText en="No photos yet. Check back soon!" tl="Wala pang larawan. Bumalik ulit mamaya!" />
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="group relative mb-3 cursor-zoom-in overflow-hidden rounded-2xl border border-border"
              onClick={() => setLightbox(item)}
              style={{
                animation: "card-scale-in 0.4s cubic-bezier(0.87, -0.41, 0.19, 1.44) both",
                animationDelay: `${i * 0.05}s`,
              } as React.CSSProperties}
            >
              <img
                src={item.url}
                alt={item.caption ?? "Community photo"}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {item.caption && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 pb-3 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm font-medium leading-snug text-white drop-shadow-sm">
                    {item.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          src={lightbox.url}
          alt={lightbox.caption ?? "Community photo"}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
