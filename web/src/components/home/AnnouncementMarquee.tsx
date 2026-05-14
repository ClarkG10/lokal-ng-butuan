import { Marquee } from "@/components/motion/Marquee";
import { LangText } from "@/components/ui/LangText";
import { useAnnouncements } from "@/features/announcements/hooks";

const FALLBACK_EN = [
  "Thursday Worship · 6:00 AM & 6:30 PM (Tagalog)",
  "Sunday Worship · 6:00 AM & 10:00 AM (Tagalog)",
  "Wednesday Worship · 6:00 AM & 6:30 PM (English)",
  "Saturday Worship · 6:00 AM & 6:00 PM (English)",
  "Welcome to Lokal ng Butuan City",
];

const FALLBACK_TL = [
  "Huwebes Pagsamba · 6:00 AM & 6:30 PM (Tagalog)",
  "Linggo Pagsamba · 6:00 AM & 10:00 AM (Tagalog)",
  "Miyerkules Pagsamba · 6:00 AM & 6:30 PM (English)",
  "Sabado Pagsamba · 6:00 AM & 6:00 PM (English)",
  "Maligayang pagdating sa Lokal ng Butuan City",
];

export function AnnouncementMarquee() {
  const { data } = useAnnouncements({ status: "published" });
  const fetched = data?.map((a) => a.title) ?? [];

  return (
    <section className="border-y border-border bg-foreground py-5 text-white">
      <Marquee speed={35} pauseOnHover>
        <div className="flex items-center gap-12 pl-12 text-sm font-medium tracking-wide">
          {[...FALLBACK_EN, ...fetched, ...FALLBACK_EN, ...fetched].map((item, i) => (
            <div key={i} className="flex items-center gap-12">
              <span>
                {i < FALLBACK_EN.length * 2
                  ? <LangText en={FALLBACK_EN[i % FALLBACK_EN.length]} tl={FALLBACK_TL[i % FALLBACK_TL.length]} />
                  : item}
              </span>
              <span aria-hidden className="text-brand-yellow">●</span>
            </div>
          ))}
        </div>
      </Marquee>
    </section>
  );
}
