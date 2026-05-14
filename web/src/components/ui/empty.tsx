import * as React from "react";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export function Empty({
  title = "Nothing here yet",
  description,
  icon: Icon = PackageOpen,
  action,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-muted">
        <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
