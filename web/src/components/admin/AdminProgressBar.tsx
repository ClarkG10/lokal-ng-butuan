import { useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "running" | "done" | "fade";

export function AdminProgressBar() {
  const isMutating = useIsMutating();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");

  function go(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  useEffect(() => {
    if (isMutating > 0) {
      go("running");
    } else if (phaseRef.current === "running") {
      go("done");
      const t1 = setTimeout(() => go("fade"), 220);
      const t2 = setTimeout(() => go("idle"), 560);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isMutating]);

  if (phase === "idle") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        style={{
          height: "100%",
          width: phase === "running" ? "72%" : "100%",
          opacity: phase === "fade" ? 0 : 1,
          background: "hsl(var(--foreground))",
          transition:
            phase === "running"
              ? "width 900ms cubic-bezier(0.08, 0.82, 0.17, 1)"
              : phase === "done"
                ? "width 180ms ease-out"
                : "opacity 280ms ease-out",
        }}
      />
    </div>
  );
}
