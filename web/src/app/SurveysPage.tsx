import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSurveys } from "@/features/surveys/hooks";
import { QrModal } from "@/components/qr/QrModal";
import { LangText } from "@/components/ui/LangText";
import { useLang } from "@/contexts/LanguageContext";

export default function SurveysPage() {
  const { data, isLoading } = useSurveys();
  const active = data?.filter((s) => s.status === "active") ?? [];
  const [qrSurvey, setQrSurvey] = useState<{ title: string; token: string } | null>(null);
  const { lang } = useLang();

  return (
    <section className="container-page section-y">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">
          <LangText en="Your voice matters" tl="Mahalaga ang iyong boses" />
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
          <LangText en="Open surveys" tl="Mga bukas na survey" />
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          <LangText
            en="Help shape the next chapter of our community. Each response takes only a minute."
            tl="Tulungan ang paghubog ng susunod na kabanata ng ating komunidad. Ang bawat sagot ay tumatagal lamang ng isang minuto."
          />
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-3xl" />)
          : active.length === 0
            ? <p className="text-lg text-muted-foreground"><LangText en="No active surveys right now. Check back soon." tl="Wala pang bukas na survey. Bumalik ulit mamaya." /></p>
            : active.map((s) => (
              <Card key={s.id} className="flex flex-col gap-0 overflow-hidden rounded-3xl border border-border p-0 shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone="ongoing" className="text-sm px-3 py-1">{lang === "tl" ? "Bukas ngayon" : "Open now"}</Badge>
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
                  <p className="mt-3 flex-1 text-base leading-relaxed text-muted-foreground">{s.description}</p>

                  <div className="mt-6 flex items-center gap-3">
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{lang === "tl" ? "Tumatagal ng 1–2 minuto" : "Takes about 1–2 minutes"}</span>
                  </div>

                  <Link
                    to={`/surveys/${s.slug}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand-green/90 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {lang === "tl" ? "Sagutin ang survey" : "Take this survey"} <ArrowUpRight className="size-5" />
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
