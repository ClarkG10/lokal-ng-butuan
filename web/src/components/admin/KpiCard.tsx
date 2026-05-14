import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  icon?: LucideIcon;
  accent?: "yellow" | "green" | "red" | "neutral";
}

const ACCENT: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  yellow: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  green:  "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  red:    "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function KpiCard({ label, value, delta, icon: Icon, accent = "neutral" }: KpiCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
          {delta && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                delta.positive ? "text-emerald-600" : "text-red-500",
              )}
            >
              {delta.positive ? "▲" : "▼"} {delta.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("grid size-11 place-items-center rounded-xl", ACCENT[accent])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
