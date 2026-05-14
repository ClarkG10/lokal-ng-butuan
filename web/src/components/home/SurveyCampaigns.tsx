import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LangText } from "@/components/ui/LangText";
import { Link } from "react-router-dom";
import { ClipboardList, QrCode } from "lucide-react";
import { useSurveys, type SurveyDetail } from "@/features/surveys/hooks";
import { QrModal } from "@/components/qr/QrModal";

const API_ROOT = (import.meta.env.VITE_API_BASE as string ?? "http://localhost:8000/api/v1")
  .replace(/\/api\/v1\/?$/, "");

export function SurveyCampaigns() {
  const { data, isLoading } = useSurveys();
  const active = data?.filter((s) => s.status === "active").slice(0, 2) ?? [];
  const [qrSurvey, setQrSurvey] = useState<SurveyDetail | null>(null);

  if (!isLoading && active.length === 0) return null;

  return (
    <section className="section-y bg-surface">
      <div className="container-page">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <LangText en="Be heard" tl="Marinig ang inyong boses" />
          </p>
          <h2 className="text-display mt-2 max-w-3xl font-display font-bold">
            <LangText en="Active surveys & campaigns" tl="Mga aktibong survey at kampanya" />
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52 w-full" />)
            : active.map((s, i) => (
                <Reveal key={s.id} delay={i * 0.05}>
                  <Card className="flex h-full flex-col gap-6 p-8 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <Badge tone="accent">
                        <ClipboardList className="mr-1.5 size-3.5" />
                        <LangText en="Survey" tl="Survey" />
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <LangText
                          en={`${s.questions.length} questions`}
                          tl={`${s.questions.length} tanong`}
                        />
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold leading-tight">{s.title}</h3>
                      {s.description && (
                        <p className="mt-3 text-muted-foreground">{s.description}</p>
                      )}
                    </div>

                    <div className="mt-auto flex items-center gap-3">
                      <Button asChild>
                        <Link to={`/surveys/${s.slug}`}>
                          <LangText en="Join now" tl="Sumali na" />
                        </Link>
                      </Button>
                      {s.qr_token && (
                        <Button variant="secondary" onClick={() => setQrSurvey(s)}>
                          <QrCode className="size-4" /> QR
                        </Button>
                      )}
                    </div>
                  </Card>
                </Reveal>
              ))}
        </div>
      </div>

      {qrSurvey && (
        <QrModal
          open={!!qrSurvey}
          onClose={() => setQrSurvey(null)}
          url={`${API_ROOT}/q/${qrSurvey.qr_token}`}
          title={qrSurvey.title}
          subtitle="Scan to take this survey"
        />
      )}
    </section>
  );
}
