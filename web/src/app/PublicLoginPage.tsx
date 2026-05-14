import { useState, useId } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from "lucide-react";
import { usePublicAuth, type PublicUser } from "@/contexts/PublicAuthContext";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

/* ── Helpers ────────────────────────────────────────────────── */
function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function isoToMmddyy(iso: string): string {
  if (!iso) return "??????";
  const [y, m, d] = iso.split("-");
  return `${m}${d}${y.slice(2)}`;
}

/** Parse full code e.g. "JPG062596" → { initials: "JPG", birthdate: "1996-06-25" } */
function parseDirectCode(raw: string): { initials: string; birthdate: string } | null {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 7) return null;
  const date = code.slice(-6);
  const initials = code.slice(0, -6);
  if (!/^\d{6}$/.test(date) || !/^[A-Z]+$/.test(initials)) return null;
  const mm = date.slice(0, 2), dd = date.slice(2, 4), yy = date.slice(4, 6);
  const n = parseInt(yy, 10);
  const year = n <= 30 ? `20${yy}` : `19${yy}`;
  const mo = parseInt(mm), dy = parseInt(dd);
  if (mo < 1 || mo > 12 || dy < 1 || dy > 31) return null;
  return { initials, birthdate: `${year}-${mm}-${dd}` };
}

/** Parse various date input formats to ISO (YYYY-MM-DD) */
function parseDateInput(input: string): string | null {
  if (!input.trim()) return null;
  const s = input.trim();

  // Month names for parsing
  const monthNames: { [key: string]: number } = {
    january: 1, jan: 1, janu: 1,
    february: 2, feb: 2, febr: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12,
  };

  // Helper: normalize month (number or name → 1-12)
  function parseMonth(m: string | number): number | null {
    if (typeof m === "number") {
      const n = parseInt(String(m), 10);
      return n >= 1 && n <= 12 ? n : null;
    }
    const lower = String(m).toLowerCase().trim();
    return monthNames[lower] ?? null;
  }

  // Helper: validate day (1-31)
  function validateDay(d: number): boolean {
    return d >= 1 && d <= 31;
  }

  // Helper: validate year and expand YY → YYYY (00-30 → 2000-2030, 31-99 → 1931-1999)
  function normalizeYear(y: number): number | null {
    if (y >= 1920 && y <= 2030) return y;
    if (y >= 0 && y <= 30) return 2000 + y;
    if (y >= 31 && y <= 99) return 1900 + y;
    return null;
  }

  // Helper: construct ISO date
  function toISO(m: number, d: number, y: number): string {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Try: "May 21, 2002" or "May 21 2002"
  const match1 = s.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (match1) {
    const m = parseMonth(match1[1]);
    const d = parseInt(match1[2], 10);
    const y = parseInt(match1[3], 10);
    if (m && validateDay(d) && normalizeYear(y)) {
      return toISO(m, d, y);
    }
  }

  // Try: "5/21/2002" or "5-21-2002" or "05/21/2002"
  const match2 = s.match(/^(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})$/);
  if (match2) {
    const m = parseInt(match2[1], 10);
    const d = parseInt(match2[2], 10);
    const y = parseInt(match2[3], 10);
    if (parseMonth(m) && validateDay(d) && normalizeYear(y)) {
      return toISO(m, d, y);
    }
  }

  // Try: "5 21 2002" (space-separated, month day year)
  const match3 = s.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
  if (match3) {
    const m = parseInt(match3[1], 10);
    const d = parseInt(match3[2], 10);
    const y = parseInt(match3[3], 10);
    if (parseMonth(m) && validateDay(d) && normalizeYear(y)) {
      return toISO(m, d, y);
    }
  }

  // Try: "21/5/2002" or "21-5-2002" (day/month/year format)
  const match4 = s.match(/^(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})$/);
  if (match4) {
    const d = parseInt(match4[1], 10);
    const m = parseInt(match4[2], 10);
    const y = parseInt(match4[3], 10);
    if (validateDay(d) && parseMonth(m) && normalizeYear(y)) {
      return toISO(m, d, y);
    }
  }

  // Try: "052102" (MMDDYY)
  const match5 = s.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (match5) {
    const m = parseInt(match5[1], 10);
    const d = parseInt(match5[2], 10);
    const yy = parseInt(match5[3], 10);
    const y = normalizeYear(yy);
    if (parseMonth(m) && validateDay(d) && y) {
      return toISO(m, d, y);
    }
  }

  // Try: "05212002" (MMDDYYYY)
  const match6 = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (match6) {
    const m = parseInt(match6[1], 10);
    const d = parseInt(match6[2], 10);
    const y = parseInt(match6[3], 10);
    if (parseMonth(m) && validateDay(d) && normalizeYear(y)) {
      return toISO(m, d, y);
    }
  }

  // Try: "May 21, 02" or "5/21/02" (short year)
  const match7 = s.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{2})$/i);
  if (match7) {
    const m = parseMonth(match7[1]);
    const d = parseInt(match7[2], 10);
    const yy = parseInt(match7[3], 10);
    const y = normalizeYear(yy);
    if (m && validateDay(d) && y) {
      return toISO(m, d, y);
    }
  }

  return null;
}

/* ── Calendar Modal ─────────────────────────────────────────── */
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_ABBR = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function CalendarModal({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const init = value
    ? new Date(value + "T00:00:00")
    : new Date(today.getFullYear() - 25, today.getMonth(), 1);

  const [vy, setVy] = useState(init.getFullYear());
  const [vm, setVm] = useState(init.getMonth()); // 0-11
  const [yearPicker, setYearPicker] = useState(false);

  const selParts = value ? value.split("-").map(Number) : null;
  const offset = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isSelected = (d: number) =>
    !!selParts && selParts[0] === vy && selParts[1] === vm + 1 && selParts[2] === d;
  const isToday = (d: number) =>
    today.getFullYear() === vy && today.getMonth() === vm && today.getDate() === d;
  const isFuture = (d: number) => new Date(vy, vm, d) > today;
  const atCurrentMonth = vy === today.getFullYear() && vm === today.getMonth();

  function prev() {
    if (vm === 0) { setVy(y => y - 1); setVm(11); } else setVm(m => m - 1);
  }
  function next() {
    if (atCurrentMonth) return;
    if (vm === 11) { setVy(y => y + 1); setVm(0); } else setVm(m => m + 1);
  }
  function isoDay(d: number) {
    return `${vy}-${String(vm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const years = Array.from(
    { length: today.getFullYear() - 1920 + 1 },
    (_, i) => today.getFullYear() - i,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
          <button
            type="button"
            onClick={prev}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setYearPicker(v => !v)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
          >
            {MONTH_NAMES[vm]} {vy}
            <ChevronDown className="size-3 text-gray-400" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={atCurrentMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-25"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {yearPicker ? (
          /* Year picker grid */
          <div className="h-60 overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-1.5">
              {years.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setVy(y); setYearPicker(false); }}
                  className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    y === vy ? "bg-brand-green text-white" : "text-gray-700 hover:bg-green-50"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Day grid */
          <div className="p-3">
            <div className="mb-2 grid grid-cols-7">
              {DAY_ABBR.map(d => (
                <span
                  key={d}
                  className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) =>
                day === null ? (
                  <span key={`b-${i}`} />
                ) : (
                  <button
                    key={day}
                    type="button"
                    disabled={isFuture(day)}
                    onClick={() => { onChange(isoDay(day)); onClose(); }}
                    className={[
                      "flex h-10 w-full items-center justify-center rounded-xl text-sm transition-colors",
                      isSelected(day)
                        ? "bg-brand-green font-bold text-white shadow-sm"
                        : isToday(day)
                        ? "font-semibold text-brand-green ring-1 ring-inset ring-brand-green"
                        : isFuture(day)
                        ? "cursor-not-allowed text-gray-300"
                        : "cursor-pointer font-medium text-gray-700 hover:bg-green-50",
                    ].join(" ")}
                  >
                    {day}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
          <span className="text-xs text-gray-400">
            {value ? isoToDisplay(value) : "No date selected"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Login Page ─────────────────────────────────────────────── */
export default function PublicLoginPage() {
  const { setPublicUser } = usePublicAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<"code" | "lookup">("code");

  // Code mode
  const [directCode, setDirectCode] = useState("");
  const codeId = useId();
  const parsedCode = directCode ? parseDirectCode(directCode) : null;

  // Lookup mode
  const [initials, setInitials] = useState("");
  const [birthday, setBirthday] = useState(""); // YYYY-MM-DD
  const [birthdayInput, setBirthdayInput] = useState(""); // Raw text input
  const [showCalendar, setShowCalendar] = useState(false);
  const initialsId = useId();
  const birthdayInputId = useId();
  const cleanInitials = initials.trim().toUpperCase().replace(/[^A-Z]/g, "");
  const lookupCode =
    mode === "lookup" && cleanInitials && birthday
      ? `${cleanInitials}${isoToMmddyy(birthday)}`
      : null;

  const [loading, setLoading] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  async function doLogin(inits: string, bdate: string) {
    setLoading(true);
    try {
      const { data } = await api.post<{ data: PublicUser }>("/public/login", {
        initials: inits,
        birthdate: bdate,
      });
      setPublicUser(data.data);
      toast({ title: `Maligayang pagdating, ${data.data.first_name}!`, variant: "success" });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Member not found. Check your code or initials and birthday.";
      toast({ title: "Sign-in failed", description: msg, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "code") {
      if (!parsedCode) {
        toast({ title: "Enter a valid code (e.g. JPG062596)", variant: "error" });
        return;
      }
      await doLogin(parsedCode.initials, parsedCode.birthdate);
    } else {
      if (!cleanInitials) { toast({ title: "Enter your initials", variant: "error" }); return; }
      if (!birthday) { toast({ title: "Pick your birthday", variant: "error" }); return; }
      await doLogin(cleanInitials, birthday);
    }
  };

  const canSubmit =
    !loading &&
    (mode === "code" ? !!parsedCode : cleanInitials.length > 0 && birthday.length > 0);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-12 sm:py-16">
      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-brand-green">Kamusta!</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          {mode === "code"
            ? "Enter your code to continue."
            : "Enter your initials and pick your birthday."}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        {/* Mode switcher */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(["code", "lookup"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                mode === m
                  ? "bg-brand-green text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {m === "code" ? "Enter Code" : "Use Initials"}
            </button>
          ))}
        </div>

        {mode === "code" ? (
          /* ── Code input ── */
          <div className="space-y-1.5">
            <label htmlFor={codeId} className="block text-sm font-medium text-gray-700">
              Your Code
            </label>
            <div className="relative">
              <input
                id={codeId}
                type="text"
                required
                autoComplete="off"
                autoFocus
                maxLength={12}
                placeholder="e.g. JDC022502"
                value={directCode}
                onChange={e =>
                  setDirectCode(e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, ""))
                }
                className={`h-12 w-full rounded-xl border px-4 pr-10 font-mono text-base font-semibold tracking-widest text-gray-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 outline-none transition-all focus:ring-1 ${
                  directCode && !parsedCode
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-200 bg-white focus:border-brand-green focus:ring-brand-green/20"
                }`}
              />
              {directCode && (
                <span
                  className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold ${
                    parsedCode ? "text-brand-green" : "text-red-400"
                  }`}
                >
                  {parsedCode ? "✓" : "✗"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
                {/* code was not shared with you during registration */}
                If you don't have a code or remember it, switch to "Use Initials" and enter your initials and birthday.
            </p>
          </div>
        ) : (
          /* ── Lookup: initials + birthday ── */
          <>
            <div className="space-y-1.5">
              <label htmlFor={initialsId} className="block text-sm font-medium text-gray-700">
                Your Initials
              </label>
              <input
                id={initialsId}
                type="text"
                required
                autoComplete="off"
                autoFocus
                maxLength={6}
                placeholder="e.g. JDC"
                value={initials}
                onChange={e =>
                  setInitials(e.target.value.toUpperCase().replace(/[^A-Za-z]/g, ""))
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 font-mono text-xl font-bold tracking-[0.22em] text-gray-900 placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 outline-none transition-all focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
              <p className="text-xs text-gray-400">
                First letter of each name — Juan Dela Cruz →{" "}
                <span className="font-mono font-semibold text-gray-600">JDC</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={birthdayInputId} className="block text-sm font-medium text-gray-700">
                Birthday
              </label>
              <div className="flex gap-2">
                <input
                  id={birthdayInputId}
                  type="text"
                  placeholder="e.g. May 21, 2002 or 5/21/02"
                  value={birthdayInput}
                  onChange={e => {
                    const raw = e.target.value;
                    setBirthdayInput(raw);
                    const parsed = parseDateInput(raw);
                    if (parsed) {
                      setBirthday(parsed);
                    }
                  }}
                  className={`flex-1 h-12 rounded-xl border px-4 text-sm outline-none transition-all focus:ring-1 ${
                    birthdayInput && !birthday
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                      : birthday
                      ? "border-brand-green/40 bg-white focus:border-brand-green focus:ring-brand-green/20"
                      : "border-gray-200 bg-white focus:border-brand-green focus:ring-brand-green/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCalendar(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 outline-none transition-all hover:border-gray-300 hover:text-gray-600 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                  title="Open calendar picker"
                >
                  <Calendar className="size-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {birthday ? isoToDisplay(birthday) : "Type or use calendar"}
                </span>
                {birthdayInput && birthday && (
                  <span className="text-brand-green font-medium">✓</span>
                )}
              </div>
            </div>

            {/* Code preview */}
            {lookupCode && (
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
                <span className="text-xs text-gray-400">Your code</span>
                <code className="font-mono text-sm font-bold tracking-widest text-gray-800">
                  {lookupCode}
                </code>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 h-12 w-full rounded-xl bg-brand-green font-semibold text-white transition-all hover:bg-brand-green/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>

      <p className="mt-8 text-[11px] text-gray-300">
        Admin?{" "}
        <a
          href="/admin/login"
          className="text-gray-400 underline transition-colors hover:text-gray-600"
        >
          Admin portal
        </a>
      </p>

      {/* Calendar modal */}
      {showCalendar && (
        <CalendarModal
          value={birthday}
          onChange={(newBday) => {
            setBirthday(newBday);
            setBirthdayInput(isoToDisplay(newBday));
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}

