import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/card";
import { LangText } from "@/components/ui/LangText";
import { MapPin, Phone } from "lucide-react";

interface ServiceEntry {
  time: string;
  lang: "Tagalog" | "English";
}
interface DaySchedule {
  day: { en: string; tl: string };
  services: ServiceEntry[];
}

const SCHEDULE: DaySchedule[] = [
  {
    day: { en: "Thursday", tl: "Huwebes" },
    services: [
      { time: "6:00 AM", lang: "Tagalog" },
      { time: "6:30 PM", lang: "Tagalog" },
    ],
  },
  {
    day: { en: "Sunday", tl: "Linggo" },
    services: [
      { time: "6:00 AM",  lang: "Tagalog" },
      { time: "10:00 AM", lang: "Tagalog" },
    ],
  },
  {
    day: { en: "Wednesday", tl: "Miyerkules" },
    services: [
      { time: "6:00 AM",  lang: "English" },
      { time: "6:30 PM",  lang: "English" },
    ],
  },
  {
    day: { en: "Saturday", tl: "Sabado" },
    services: [
      { time: "6:00 AM", lang: "English" },
      { time: "6:00 PM", lang: "English" },
    ],
  },
];

export function ChurchInfo() {
  return (
    <section className="section-y bg-surface">
      <div className="container-page grid gap-10 md:grid-cols-2 md:items-start">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-red">
            <LangText en="About us" tl="Tungkol sa amin" />
          </p>
          <h2 className="text-display mt-2 font-display font-bold">
            Iglesia ni Cristo —<br />Lokal ng Butuan City
          </h2>
          <p className="mt-5 text-muted-foreground md:text-lg">
            <LangText
              en="We are the Iglesia ni Cristo — Lokal ng Butuan City, serving our members in Agusan del Norte. This platform keeps our members informed, connected, and engaged in the life of the Church."
              tl="Kami ang Iglesia ni Cristo — Lokal ng Butuan City, naglilingkod sa aming mga kaanib sa Agusan del Norte. Ang platform na ito ay nagpapanatiling may kaalaman, konektado, at kasali ang aming mga kaanib sa buhay ng Iglesia."
            />
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="divide-y divide-border overflow-hidden p-0">
            {/* ── Worship schedule ──────────────────────────── */}
            <div className="p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <LangText en="Worship Services" tl="Mga Pagsamba" />
              </p>
              <ul className="space-y-4">
                {SCHEDULE.map(({ day, services }) => (
                  <li key={day.en}>
                    <span className="mb-1.5 block text-sm font-semibold">
                      <LangText en={day.en} tl={day.tl} />
                    </span>
                    <div className="space-y-1 pl-3 border-l-2 border-border">
                      {services.map((s) => (
                        <div key={s.time} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-sm text-muted-foreground tabular-nums">
                            {s.time}
                          </span>
                          <span
                            className={`rounded-full px-2 py-px text-[10px] font-semibold ${
                              s.lang === "Tagalog"
                                ? "bg-brand-green/10 text-brand-green"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {s.lang}
                          </span>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Location ──────────────────────────────────── */}
            <div className="flex items-start gap-4 p-6">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green/15">
                <MapPin className="size-5 text-brand-green" />
              </div>
              <div>
                <h3 className="font-semibold">
                  <LangText en="Location" tl="Lokasyon" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <LangText
                    en="Butuan City, Agusan del Norte, Philippines"
                    tl="Butuan City, Agusan del Norte, Pilipinas"
                  />
                </p>
              </div>
            </div>

            {/* ── Contact ───────────────────────────────────── */}
            <div className="flex items-start gap-4 p-6">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-red/10">
                <Phone className="size-5 text-brand-red" />
              </div>
              <div>
                <h3 className="font-semibold">
                  <LangText en="Get in touch" tl="Makipag-ugnayan" />
                </h3>
                <p className="text-sm text-muted-foreground">hello@butuanlokal.church</p>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
