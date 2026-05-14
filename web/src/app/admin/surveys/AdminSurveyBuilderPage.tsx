import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, GripVertical, Plus, QrCode, Save, Trash2 } from "lucide-react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/PageHeader";
import { useCreateSurvey, useAdminSurveyDetail, useUpdateSurvey, type QuestionType, type SurveyInput } from "@/features/surveys/hooks";
import { useEvents } from "@/features/events/hooks";
import { toast } from "@/components/ui/toaster";
import { QrModal } from "@/components/qr/QrModal";

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: "short_text",    label: "Short text",      desc: "Single-line free text. Best for brief one-line answers, codes, or labels." },
  { value: "long_text",     label: "Long text",       desc: "Multi-line text area. Best for detailed feedback, comments, or open-ended responses." },
  { value: "single_choice", label: "Single choice",   desc: "Respondent picks exactly one option. Best for yes/no or multiple-choice with one answer." },
  { value: "multi_choice",  label: "Multiple choice", desc: "Respondent picks one or more options. Best for \"select all that apply\" questions." },
  { value: "rating",        label: "Rating (1–5)",    desc: "Numbered scale 1–5. Best for satisfaction scores, NPS, or rating an experience." },
  { value: "email",         label: "Email",           desc: "Validated e-mail address field. The browser checks the format automatically." },
  { value: "phone",         label: "Phone",           desc: "Phone number field with numeric keyboard on mobile devices." },
  { value: "consent",       label: "Consent",         desc: "A checkbox the respondent must tick. Best for terms, privacy notices, or opt-ins. Put the consent statement in the Help text field." },
];

/* These types can never be required — their nature is always optional */
const ALWAYS_OPTIONAL: QuestionType[] = ["email", "phone", "consent"];

/* CSS-only tooltip — no extra dependencies */
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <span className="flex size-4 cursor-help items-center justify-center rounded-full bg-muted text-[10px] font-bold leading-none text-muted-foreground select-none">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-white p-3 text-xs text-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
        {text}
        <span className="absolute -bottom-[5px] left-1/2 size-[9px] -translate-x-1/2 rotate-45 border-b border-r border-border bg-white" />
      </span>
    </span>
  );
}

interface DraftQ {
  id: string | number;
  step: number;
  sort_order: number;
  type: QuestionType;
  label: string;
  help_text?: string;
  options?: string[];
  is_required: boolean;
}

function QuestionEditor({
  q, onChange, onRemove,
}: { q: DraftQ; onChange: (q: DraftQ) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const needsOptions = q.type === "single_choice" || q.type === "multi_choice";

  // Local state lets the user clear the field to type a new step number without it snapping back
  const [localStep, setLocalStep] = useState(String(q.step));
  useEffect(() => setLocalStep(String(q.step)), [q.step]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-border bg-card shadow-sm transition-shadow ${isDragging ? "opacity-60 shadow-lg" : "hover:shadow-md"}`}
    >
      {/* card header bar */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2 rounded-t-2xl">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="grid size-7 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question</span>
        <span className="ml-auto text-xs text-muted-foreground">Step {q.step}</span>
      </div>

      <div className="p-5">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold">Question label</Label>
              <Input value={q.label} onChange={(e) => onChange({ ...q, label: e.target.value })} placeholder="e.g. What is your feedback?" />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center text-sm font-semibold">
                Type
                {(() => {
                  const td = QUESTION_TYPES.find(t => t.value === q.type);
                  return td ? <InfoTooltip text={td.desc} /> : null;
                })()}
              </Label>
              <Select value={q.type} onChange={(e) => {
                const newType = e.target.value as QuestionType;
                onChange({ ...q, type: newType, is_required: ALWAYS_OPTIONAL.includes(newType) ? false : q.is_required });
              }}>
                {QUESTION_TYPES.filter((t) => !(["email", "phone", "consent"] as string[]).includes(t.value)).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
              {(() => {
                const td = QUESTION_TYPES.find(t => t.value === q.type);
                return td ? (
                  <p className="text-[11px] leading-tight text-muted-foreground">{td.desc}</p>
                ) : null;
              })()}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_120px]">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold">Help text <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input value={q.help_text ?? ""} onChange={(e) => onChange({ ...q, help_text: e.target.value })} placeholder="Shown below the question as a hint" />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center text-sm font-semibold">
                Step
                <InfoTooltip text="Questions sharing the same step number appear on the same page. Increase the step to start a new page." />
              </Label>
              <Input
                type="number"
                min={1}
                value={localStep}
                onChange={(e) => {
                  setLocalStep(e.target.value);
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n >= 1) onChange({ ...q, step: n });
                }}
                onBlur={() => {
                  const n = parseInt(localStep, 10);
                  const safe = isNaN(n) || n < 1 ? 1 : n;
                  setLocalStep(String(safe));
                  onChange({ ...q, step: safe });
                }}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>

          {needsOptions && (
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold">Options</Label>
              <Textarea
                rows={4}
                value={(q.options ?? []).join("\n")}
                onChange={(e) => onChange({ ...q, options: e.target.value.split("\n") })}
                placeholder={"Option A\nOption B\nOption C"}
              />
              <p className="text-xs text-muted-foreground">Type each choice on its own line. Press Enter to add the next option.</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            {ALWAYS_OPTIONAL.includes(q.type) ? (
              <p className="text-[11px] italic text-muted-foreground">Always optional — this type cannot be required.</p>
            ) : (
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={q.is_required}
                  onChange={(e) => onChange({ ...q, is_required: e.target.checked })}
                />
                Required
              </label>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-brand-red hover:bg-brand-red/10 hover:text-brand-red">
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSurveyBuilderPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const numericId = isNew ? undefined : Number(id);
  const navigate = useNavigate();
  const { data: existing } = useAdminSurveyDetail(numericId);
  const { data: eventList } = useEvents({ status: "all", per_page: 100 });

  const [meta, setMeta] = useState({ title: "", slug: "", description: "", status: "draft" as SurveyInput["status"], event_id: null as number | null });
  const [questions, setQuestions] = useState<DraftQ[]>([]);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (existing) {
      setMeta({ title: existing.title, slug: existing.slug, description: existing.description, status: existing.status, event_id: existing.event_id ?? null });
      setQuestions(existing.questions.map((q) => ({
        id: q.id, step: q.step, sort_order: q.sort_order, type: q.type, label: q.label,
        help_text: q.help_text ?? "", options: q.options ?? [], is_required: q.is_required,
      })));
    }
  }, [existing]);

  const create = useCreateSurvey();
  const update = useUpdateSurvey(numericId ?? 0);

  const bottomRef = useRef<HTMLDivElement>(null);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        step: prev.length === 0 ? 1 : prev[prev.length - 1].step,
        sort_order: prev.length,
        type: "short_text",
        label: "",
        is_required: false,
      },
    ]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    setQuestions(arrayMove(questions, oldIndex, newIndex).map((q, i) => ({ ...q, sort_order: i })));
  };

  const submit = async () => {
    if (!meta.title.trim()) {
      toast({ title: "Title is required", variant: "error" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Add at least one question", variant: "error" });
      return;
    }
    if (questions.some((q) => !q.label.trim())) {
      toast({ title: "All questions must have a label.", variant: "error" });
      return;
    }
    const payload: SurveyInput = {
      ...meta,
      questions: questions.map((q, idx) => ({
        id: typeof q.id === "number" ? q.id : undefined,
        step: q.step,
        sort_order: idx,
        type: q.type,
        label: q.label,
        help_text: q.help_text ?? null,
        options: q.options?.filter(Boolean).length ? q.options.filter(Boolean) : null,
        is_required: q.is_required,
        visibility_rules: null,
      })),
    };
    try {
      if (isNew) {
        const created = await create.mutateAsync(payload);
        toast({ title: "Survey created", variant: "success" });
        navigate(`/admin/surveys/${created.id}`);
      } else {
        await update.mutateAsync(payload);
        toast({ title: "Survey saved", variant: "success" });
      }
    } catch {
      toast({ title: "Save failed", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "New survey" : meta.title || "Edit survey"}
        description="Define questions, steps, and validation rules."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link to="/admin/surveys"><ArrowLeft className="size-4" /> Back</Link>
            </Button>
            {!isNew && existing?.qr_token && (
              <Button variant="secondary" onClick={() => setShowQr(true)}>
                <QrCode className="size-4" /> Show QR
              </Button>
            )}
            {!isNew && meta.slug ? (
              <Button asChild variant="secondary">
                <Link to={`/surveys/${meta.slug}`} target="_blank" rel="noreferrer">
                  <Eye className="size-4" /> Preview
                </Link>
              </Button>
            ) : (
              <Button variant="secondary" disabled title="Save the survey first to preview it.">
                <Eye className="size-4" /> Preview
              </Button>
            )}
          </>
        }
      />

      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label className="flex items-center">
              Slug
              <InfoTooltip text="A slug is the short, URL-friendly identifier for this survey: /surveys/your-slug. Leave blank and the server will auto-generate one from the title. Use only lowercase letters, numbers, and hyphens — no spaces." />
            </Label>
            <Input
              value={meta.slug}
              placeholder="auto-generated from title"
              onChange={(e) => setMeta({ ...meta, slug: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value as SurveyInput["status"] })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="flex items-center gap-1">
              Linked event
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              <InfoTooltip text="When an event is linked, an 'About this event' button appears on the survey page. Respondents can tap it to read the event details (date, location, description) without leaving the survey." />
            </Label>
            <Select
              value={meta.event_id?.toString() ?? ""}
              onChange={(e) => setMeta({ ...meta, event_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">No event linked</option>
              {(eventList ?? []).map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <div className="mt-4 rounded-xl border border-brand-green/30 bg-brand-green/5 px-4 py-3">
        <p className="text-sm font-medium text-brand-green">Identity fields (always shown first — no need to add as questions)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Every survey automatically opens with <strong>First name</strong> and <strong>Last name</strong> (both required), <strong>Middle name</strong> (optional), plus the respondent&apos;s <strong>Group</strong> (Binhi / Kadiwa / Buklod, required).
          <strong> Email</strong> and <strong>Phone</strong> are also always shown but are never required.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Questions</h2>
      </div>

      <div className="mt-3 space-y-3">
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {questions.map((q) => (
              <QuestionEditor
                key={q.id}
                q={q}
                onChange={(next) => setQuestions(questions.map((cur) => cur.id === q.id ? next : cur))}
                onRemove={() => setQuestions(questions.filter((cur) => cur.id !== q.id))}
              />
            ))}
          </SortableContext>
        </DndContext>
        {questions.length === 0 && (
          <Card className="grid place-items-center p-12 text-center">
            <p className="text-sm text-muted-foreground">No questions yet. Add your first one below.</p>
          </Card>
        )}
      </div>

      <div ref={bottomRef} />

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-between border-t border-border bg-card px-4 py-3 lg:-mx-8 lg:px-8">
        <Button variant="outline" onClick={addQuestion}>
          <Plus className="size-4" /> Add question
        </Button>
        <Button variant="default" onClick={submit} loading={create.isPending || update.isPending} disabled={create.isPending || update.isPending}>
          <Save className="size-4" /> Save survey
        </Button>
      </div>

      {existing?.qr_token && (
        <QrModal
          open={showQr}
          onClose={() => setShowQr(false)}
          url={`${(import.meta.env.VITE_API_BASE as string)?.replace("/api/v1", "")}/q/${existing.qr_token}`}
          title={existing.title}
          subtitle="Scan to open this survey"
        />
      )}
    </div>
  );
}
