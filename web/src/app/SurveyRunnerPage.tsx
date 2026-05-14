import { useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, MapPin, Search, User } from "lucide-react";
import {
  useSurvey,
  useSubmitSurvey,
  type QuestionType,
  type SurveyQuestion,
} from "@/features/surveys/hooks";
import { useMasterlistSearch, type MasterlistSearchResult, type Affiliation } from "@/features/masterlists/hooks";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";

/* ── QuestionField ─────────────────────────────────────────── */
function QuestionField({
  q, value, onChange,
}: { q: SurveyQuestion; value: unknown; onChange: (v: unknown) => void }) {
  switch (q.type as QuestionType) {
    case "long_text":
      return (
        <Textarea
          rows={4}
          className="resize-none text-base leading-relaxed"
          placeholder="Type your answer here…"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={q.is_required}
        />
      );
    case "email":
      return (
        <Input
          type="email"
          className="h-11 text-base"
          placeholder="you@example.com"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={q.is_required}
        />
      );
    case "phone":
      return (
        <Input
          type="tel"
          className="h-11 text-base"
          placeholder="0917 000 0000"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={q.is_required}
        />
      );
    case "rating": {
      const v = (value as number) ?? 0;
      const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex-1 rounded-xl border-2 py-3 text-lg font-bold transition-all ${
                  v === n
                    ? "border-brand-yellow bg-brand-yellow text-foreground shadow-sm scale-105"
                    : v > n
                      ? "border-brand-yellow/40 bg-brand-yellow/10 text-foreground/60"
                      : "border-border bg-card hover:border-brand-yellow/50 hover:bg-brand-yellow/5"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-muted-foreground">
            {v > 0 ? `${v} — ${labels[v]}` : "Tap a number to rate"}
          </p>
        </div>
      );
    }
    case "single_choice":
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                value === opt
                  ? "border-brand-green bg-brand-green/5 shadow-sm"
                  : "border-border bg-card hover:border-brand-green/30 hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  value === opt ? "border-brand-green bg-brand-green" : "border-muted-foreground/40"
                }`}
              >
                {value === opt && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <input
                type="radio"
                name={`q-${q.id}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
                required={q.is_required}
                className="sr-only"
              />
              <span className="text-base">{opt}</span>
            </label>
          ))}
        </div>
      );
    case "multi_choice": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt) => {
            const checked = arr.includes(opt);
            return (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  checked
                    ? "border-brand-green bg-brand-green/5 shadow-sm"
                    : "border-border bg-card hover:border-brand-green/30 hover:bg-muted/40"
                }`}
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    checked ? "border-brand-green bg-brand-green" : "border-muted-foreground/40"
                  }`}
                >
                  {checked && (
                    <svg className="size-2.5 text-white" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked ? [...arr, opt] : arr.filter((v) => v !== opt))}
                  className="sr-only"
                />
                <span className="text-base">{opt}</span>
              </label>
            );
          })}
          <p className="text-xs text-muted-foreground">Select all that apply.</p>
        </div>
      );
    }
    case "consent":
      return (
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 transition-all ${value === true ? "border-brand-green bg-brand-green/5" : "border-border hover:border-brand-green/30"}`}>
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            required={q.is_required}
            className="mt-0.5 size-4 accent-brand-green"
          />
          <span className="text-base leading-relaxed">{q.help_text ?? "I agree."}</span>
        </label>
      );
    default:
      return (
        <Input
          className="h-11 text-base"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={q.is_required}
        />
      );
  }
}

/* ── Respondent state type ──────────────────────────────────── */
interface RespondentState {
  first_name: string;
  middle_name: string;
  last_name: string;
  purok: string;
  belongs_to: "" | Affiliation;
  email: string;
  phone: string;
}

/* ── IdentityStep — always shown first ─────────────────────── */
function IdentityStep({
  respondent,
  setRespondent,
  recordForCampaign,
  setRecordForCampaign,
  onNext,
}: {
  respondent: RespondentState;
  setRespondent: (r: RespondentState) => void;
  recordForCampaign: boolean;
  setRecordForCampaign: (v: boolean) => void;
  onNext: () => void;
}) {
  const [lookupQ, setLookupQ] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: lookupResults } = useMasterlistSearch(lookupQ);

  const fillFromLookup = (r: MasterlistSearchResult) => {
    setRespondent({
      first_name: r.first_name,
      middle_name: r.middle_name ?? "",
      last_name: r.last_name,
      purok: r.purok ?? "",
      belongs_to: r.belongs_to,
      email: r.email ?? "",
      phone: r.phone ?? "",
    });
    setLookupQ("");
    setShowDropdown(false);
  };

  const handleContinue = () => {
    if (!respondent.first_name.trim() || !respondent.last_name.trim()) {
      toast({ title: "First name and last name are required.", variant: "error" });
      return;
    }
    if (!respondent.purok.trim()) {
      toast({ title: "Purok / Area is required.", variant: "error" });
      return;
    }
    if (!respondent.belongs_to) {
      toast({ title: "Please select your affiliation.", variant: "error" });
      return;
    }
    onNext();
  };

  return (
    <Card className="rounded-2xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-full bg-brand-green/10">
          <User className="size-4 text-brand-green" />
        </div>
        <div>
          <h3 className="font-semibold leading-tight">Tell us who you are</h3>
          <p className="text-sm text-muted-foreground">
            Fields marked <span className="text-brand-red">*</span> are required
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Masterlist autofill search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9 text-sm"
            placeholder="Already registered? Search your name to auto-fill"
            value={lookupQ}
            onChange={(e) => { setLookupQ(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          {showDropdown && lookupResults && lookupResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              {lookupResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/60"
                  onMouseDown={() => fillFromLookup(r)}
                >
                  <span className="flex-1 font-medium">
                    {r.last_name}, {r.first_name}
                    {r.middle_name && ` ${r.middle_name.charAt(0)}.`}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.belongs_to}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your name</p>
          {/* First name + Last name side by side */}
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">First name <span className="text-brand-red">*</span></Label>
              <Input
                className="h-10"
                placeholder="e.g. Juan"
                required
                value={respondent.first_name}
                onChange={(e) => setRespondent({ ...respondent, first_name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Last name <span className="text-brand-red">*</span></Label>
              <Input
                className="h-10"
                placeholder="e.g. Dela Cruz"
                required
                value={respondent.last_name}
                onChange={(e) => setRespondent({ ...respondent, last_name: e.target.value })}
              />
            </div>
          </div>
          {/* Middle name on its own row */}
          <div className="grid gap-1.5 pt-3">
            <Label className="text-sm font-medium text-muted-foreground">Middle name <span className="text-xs">(optional)</span></Label>
            <Input
              className="h-10"
              placeholder="e.g. Santos"
              value={respondent.middle_name}
              onChange={(e) => setRespondent({ ...respondent, middle_name: e.target.value })}
            />
          </div>
        </div>

        {/* Purok / Area */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Purok <span className="font-normal normal-case">/</span> Area <span className="text-brand-red">*</span>
          </p>
          <div className="grid gap-1.5 pt-2">
            <Input
              className="h-10"
              placeholder="e.g. Purok 5, Baan"
              required
              value={respondent.purok}
              onChange={(e) => setRespondent({ ...respondent, purok: e.target.value })}
            />
          </div>
        </div>

        {/* Grupo / Group */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Grupo <span className="font-normal normal-case">/</span> Group <span className="text-brand-red">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["Binhi", "Kadiwa", "Buklod"] as const).map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                  respondent.belongs_to === opt
                    ? "border-brand-green bg-brand-green text-white shadow-sm"
                    : "border-border bg-card hover:border-brand-green/30"
                }`}
              >
                <input
                  type="radio"
                  name="belongs_to"
                  className="sr-only"
                  checked={respondent.belongs_to === opt}
                  onChange={() => setRespondent({ ...respondent, belongs_to: opt })}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Contact info (optional) */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact <span className="text-xs font-normal normal-case text-muted-foreground">(optional)</span></p>
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <Input
                type="email"
                className="h-10"
                placeholder="you@email.com"
                value={respondent.email}
                onChange={(e) => setRespondent({ ...respondent, email: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
              <Input
                type="tel"
                className="h-10"
                placeholder="09XX XXX XXXX"
                value={respondent.phone}
                onChange={(e) => setRespondent({ ...respondent, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Campaign consent — only if both contact fields are filled */}
        {respondent.email.trim() !== "" && respondent.phone.trim() !== "" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-green/30 bg-brand-green/5 px-4 py-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 cursor-pointer accent-brand-green"
              checked={recordForCampaign}
              onChange={(e) => setRecordForCampaign(e.target.checked)}
            />
            <span className="text-sm leading-relaxed">
              <span className="font-semibold text-brand-green">Keep me updated</span>
              <span className="ml-1 text-muted-foreground">
                — save my info for future campaigns and community updates.
              </span>
            </span>
          </label>
        )}

        <Button size="lg" className="w-full" onClick={handleContinue}>
          Continue to questions <ArrowRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

/* ── SurveyRunnerPage ───────────────────────────────────────── */
export default function SurveyRunnerPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const viaQr = params.get("qr") === "1";
  const { data: survey, isLoading } = useSurvey(slug);

  // All hooks before any early return
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [respondent, setRespondent] = useState<RespondentState>({
    first_name: "",
    middle_name: "",
    last_name: "",
    purok: "",
    belongs_to: "",
    email: "",
    phone: "",
  });
  const [recordForCampaign, setRecordForCampaign] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [identityDone, setIdentityDone] = useState(false);
  const [done, setDone] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const steps = useMemo(() => {
    if (!survey) return [];
    const grouped = new Map<number, SurveyQuestion[]>();
    [...survey.questions].sort((a, b) => a.step - b.step || a.sort_order - b.sort_order).forEach((q) => {
      const arr = grouped.get(q.step) ?? [];
      arr.push(q);
      grouped.set(q.step, arr);
    });
    return Array.from(grouped.values());
  }, [survey]);

  const submit = useSubmitSurvey(survey?.id ?? 0);

  if (isLoading || !survey) {
    return <div className="container-page section-y"><Skeleton className="h-96 w-full" /></div>;
  }

  if (done) {
    return (
      <div className="container-page section-y grid place-items-center">
        <Card className="max-w-sm w-full rounded-2xl border border-border p-8 text-center shadow-md">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-green/10">
            <CheckCircle2 className="size-8 text-brand-green" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Thank you!</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your response has been recorded. Thank you for your participation.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/">Back to home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const isLast = stepIndex >= steps.length - 1;
  const currentQuestions = steps[stepIndex] ?? [];
  const progress = identityDone
    ? Math.round(((stepIndex + 1) / Math.max(1, steps.length)) * 100)
    : 0;

  const goBack = () => {
    if (stepIndex === 0) {
      setIdentityDone(false);
    } else {
      setStepIndex((i) => Math.max(0, i - 1));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLast) {
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Capture geolocation + reverse-geocode before submitting
    let latitude: number | null = null;
    let longitude: number | null = null;
    let location_name: string | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, maximumAge: 60000 })
      );
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { "Accept-Language": "en", "User-Agent": "ButuanLokalPlatform/1.0" } }
      );
      if (resp.ok) {
        const geo = await resp.json();
        location_name =
          geo.address?.city ??
          geo.address?.town ??
          geo.address?.village ??
          geo.address?.suburb ??
          geo.display_name ??
          null;
      }
    } catch {
      // Geolocation is optional — proceed without it
    }

    try {
      await submit.mutateAsync({
        answers,
        respondent: {
          first_name: respondent.first_name.trim(),
          middle_name: respondent.middle_name.trim() || undefined,
          last_name: respondent.last_name.trim(),
          belongs_to: respondent.belongs_to as Affiliation,
          purok: respondent.purok.trim(),
          email: respondent.email.trim() || undefined,
          phone: respondent.phone.trim() || undefined,
          record_for_campaign: recordForCampaign,
        },
        via_qr: viaQr,
        latitude,
        longitude,
        location_name,
      });
      setDone(true);
    } catch {
      toast({ title: "Submission failed", variant: "error" });
    }
  };

  return (
    <>
      <div className="container-page section-y mx-auto max-w-xl pb-24">
        {/* Back link */}
        <Link
          to="/surveys"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All surveys
        </Link>

        {/* Survey header */}
        <div className="mt-4">
          <h1 className="font-display text-2xl font-bold leading-snug">{survey.title}</h1>
          {survey.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{survey.description}</p>
          )}
        </div>

        {/* Step progress — only visible during questions */}
        {identityDone && (
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Question step {stepIndex + 1} of {steps.length}
              </span>
              <span className="text-xs font-semibold text-brand-green">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-green transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-5">
          {!identityDone ? (
            <IdentityStep
              respondent={respondent}
              setRespondent={setRespondent}
              recordForCampaign={recordForCampaign}
              setRecordForCampaign={setRecordForCampaign}
              onNext={() => { setIdentityDone(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          ) : (
            <form onSubmit={next} className="space-y-4">
              {currentQuestions.map((q, qi) => (
                <Card key={q.id} className="rounded-2xl border border-border shadow-sm">
                  {/* Question header strip */}
                  <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xs font-bold text-brand-green">
                      {qi + 1}
                    </span>
                    <div>
                      <p className="font-semibold leading-snug">
                        {q.label}{" "}
                        {q.is_required && <span className="text-brand-red">*</span>}
                      </p>
                      {q.help_text && q.type !== "consent" && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{q.help_text}</p>
                      )}
                    </div>
                  </div>
                  {/* Answer area */}
                  <div className="px-5 py-4">
                    <QuestionField
                      q={q}
                      value={answers[q.id]}
                      onChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                    />
                  </div>
                </Card>
              ))}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button type="submit" loading={submit.isPending} disabled={submit.isPending}>
                  {isLast ? "Submit response" : "Next"} <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Sticky "About this event" button — only shown when survey is linked to an event */}
      {survey.event && (
        <>
          <button
            type="button"
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-xl ring-2 ring-white/20 transition-transform hover:scale-105 hover:bg-brand-green/90"
            onClick={() => setShowEventModal(true)}
          >
            <Calendar className="size-4" />
            About this event
          </button>

          <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
            <DialogContent className="max-w-md overflow-hidden rounded-3xl p-0">
              {/* Cover image */}
              {survey.event.cover_url ? (
                <img
                  src={survey.event.cover_url}
                  alt={survey.event.title}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-brand-green/10 to-brand-yellow/10">
                  <Calendar className="size-10 text-brand-green/40" />
                </div>
              )}

              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl leading-snug">{survey.event.title}</DialogTitle>
                  <DialogDescription className={survey.event.description ? "mt-2 text-sm leading-relaxed" : "sr-only"}>
                    {survey.event.description ?? survey.event.title}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Calendar className="mt-0.5 size-4 shrink-0 text-brand-green" />
                    <span>
                      {formatDate(survey.event.starts_at)}
                      {survey.event.ends_at && ` – ${formatDate(survey.event.ends_at)}`}
                    </span>
                  </div>
                  {survey.event.location && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-green" />
                      <span>{survey.event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
