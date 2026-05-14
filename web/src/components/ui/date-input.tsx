/**
 * DateInput — text field + calendar modal picker, consistent with PublicLoginPage UX.
 * Accepts / emits ISO dates (YYYY-MM-DD). Flexible text parsing lets users type in
 * almost any format (May 21 2002, 5/21/02, 052102, …).
 */

import { useState, useEffect, useId } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/portal";

/* ── Helpers ──────────────────────────────────────────────── */

export function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

/** Parse many date text formats → ISO YYYY-MM-DD, or null if unrecognised. */
export function parseDateInput(input: string): string | null {
  if (!input.trim()) return null;
  const s = input.trim();

  const monthNames: { [k: string]: number } = {
    january:1,jan:1,janu:1, february:2,feb:2,febr:2, march:3,mar:3,
    april:4,apr:4, may:5, june:6,jun:6, july:7,jul:7,
    august:8,aug:8, september:9,sep:9,sept:9, october:10,oct:10,
    november:11,nov:11, december:12,dec:12,
  };
  const parseMonth = (m: string | number): number | null => {
    if (typeof m === "number") { const n = Number(m); return n >= 1 && n <= 12 ? n : null; }
    return monthNames[String(m).toLowerCase().trim()] ?? null;
  };
  const validateDay = (d: number) => d >= 1 && d <= 31;
  const normalizeYear = (y: number): number | null => {
    if (y >= 1920 && y <= 2100) return y;
    if (y >= 0   && y <= 30)   return 2000 + y;
    if (y >= 31  && y <= 99)   return 1900 + y;
    return null;
  };
  const toISO = (m: number, d: number, y: number) =>
    `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  // "May 21, 2002" / "May 21 2002"
  const r1 = s.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{2,4})$/i);
  if (r1) {
    const m = parseMonth(r1[1]), d = parseInt(r1[2],10), y = normalizeYear(parseInt(r1[3],10));
    if (m && validateDay(d) && y) return toISO(m, d, y);
  }
  // "5/21/2002" or "5-21-2002"
  const r2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (r2) {
    const m = parseInt(r2[1],10), d = parseInt(r2[2],10), y = normalizeYear(parseInt(r2[3],10));
    if (parseMonth(m) && validateDay(d) && y) return toISO(m, d, y);
  }
  // "052102" (MMDDYY)
  const r3 = s.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (r3) {
    const m = parseInt(r3[1],10), d = parseInt(r3[2],10), y = normalizeYear(parseInt(r3[3],10));
    if (parseMonth(m) && validateDay(d) && y) return toISO(m, d, y);
  }
  // "05212002" (MMDDYYYY)
  const r4 = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (r4) {
    const m = parseInt(r4[1],10), d = parseInt(r4[2],10), y = normalizeYear(parseInt(r4[3],10));
    if (parseMonth(m) && validateDay(d) && y) return toISO(m, d, y);
  }
  return null;
}

/* ── Calendar Modal ───────────────────────────────────────── */

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_ABBR = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface CalendarModalProps {
  value: string;
  onChange: (iso: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
}

function CalendarModal({ value, onChange, onClose, min, max }: CalendarModalProps) {
  const today = new Date();
  const maxDate = max ? new Date(max + "T00:00:00") : null;
  const minDate = min ? new Date(min + "T00:00:00") : null;

  const init = value
    ? new Date(value + "T00:00:00")
    : new Date(today.getFullYear() - 25, today.getMonth(), 1);

  const [vy, setVy] = useState(init.getFullYear());
  const [vm, setVm] = useState(init.getMonth());
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
  const isDisabled = (d: number) => {
    const cell = new Date(vy, vm, d);
    if (maxDate && cell > maxDate) return true;
    if (minDate && cell < minDate) return true;
    return false;
  };

  function prev() {
    if (vm === 0) { setVy(y => y - 1); setVm(11); } else setVm(m => m - 1);
  }
  function next() {
    // Block going forward if max = today (birthdate mode)
    const nextMonth = vm === 11
      ? new Date(vy + 1, 0, 1)
      : new Date(vy, vm + 1, 1);
    if (maxDate && nextMonth > maxDate) return;
    if (vm === 11) { setVy(y => y + 1); setVm(0); } else setVm(m => m + 1);
  }
  function isoDay(d: number) {
    return `${vy}-${String(vm + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }

  const startYear = minDate ? minDate.getFullYear() : 1920;
  const endYear   = maxDate ? maxDate.getFullYear() : today.getFullYear() + 5;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);

  const atMinMonth = minDate && vy === minDate.getFullYear() && vm === minDate.getMonth();
  const atMaxMonth = maxDate && vy === maxDate.getFullYear() && vm === maxDate.getMonth();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
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
            disabled={!!atMinMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-25"
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
            disabled={!!atMaxMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-25"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {yearPicker ? (
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
          <div className="p-3">
            <div className="mb-2 grid grid-cols-7">
              {DAY_ABBR.map(d => (
                <span key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
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
                    disabled={isDisabled(day)}
                    onClick={() => { onChange(isoDay(day)); onClose(); }}
                    className={cn(
                      "flex h-10 w-full items-center justify-center rounded-xl text-sm transition-colors",
                      isSelected(day)
                        ? "bg-brand-green font-bold text-white shadow-sm"
                        : isToday(day)
                        ? "font-semibold text-brand-green ring-1 ring-inset ring-brand-green"
                        : isDisabled(day)
                        ? "cursor-not-allowed text-gray-300"
                        : "cursor-pointer font-medium text-gray-700 hover:bg-green-50",
                    )}
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

/* ── DateInput ────────────────────────────────────────────── */

export interface DateInputProps {
  /** ISO YYYY-MM-DD */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  /** ISO YYYY-MM-DD — days after max are disabled */
  max?: string;
  /** ISO YYYY-MM-DD — days before min are disabled */
  min?: string;
  className?: string;
  id?: string;
  hint?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = "e.g. May 21, 2002 or 5/21/02",
  max,
  min,
  className,
  id,
  hint,
}: DateInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  // Text the user typed / display text
  const [textValue, setTextValue] = useState(() => (value ? isoToDisplay(value) : ""));
  const [showCalendar, setShowCalendar] = useState(false);

  // Sync display text when external value changes (e.g. edit modal pre-fill)
  useEffect(() => {
    setTextValue(value ? isoToDisplay(value) : "");
  }, [value]);

  const handleTextChange = (raw: string) => {
    setTextValue(raw);
    if (!raw.trim()) { onChange(""); return; }
    const parsed = parseDateInput(raw);
    if (parsed) onChange(parsed);
  };

  const handleCalendarPick = (iso: string) => {
    onChange(iso);
    setTextValue(isoToDisplay(iso));
    setShowCalendar(false);
  };

  const isValid = !!value;
  const hasInput = textValue.trim().length > 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={textValue}
          onChange={e => handleTextChange(e.target.value)}
          className={cn(
            "flex h-10 flex-1 rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasInput && !isValid
              ? "border-red-300 bg-red-50 focus-visible:ring-red-300"
              : isValid
              ? "border-brand-green/40 focus-visible:ring-brand-green/40"
              : "border-input",
          )}
        />
        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          title="Open calendar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Calendar className="size-4" />
        </button>
      </div>

      <p className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{hint ?? (value ? isoToDisplay(value) : "Type or use calendar \u2192")}</span>
        {hasInput && isValid && (
          <span className="font-medium text-brand-green">✓</span>
        )}
      </p>

      {showCalendar && (
        <Portal>
          <CalendarModal
            value={value}
            onChange={handleCalendarPick}
            onClose={() => setShowCalendar(false)}
            max={max}
            min={min}
          />
        </Portal>
      )}
    </div>
  );
}
