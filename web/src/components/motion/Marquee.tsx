import * as _FastMarqueeNs from "react-fast-marquee";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type FastMarqueeProps = { speed?: number; pauseOnHover?: boolean; gradient?: boolean; className?: string; children?: React.ReactNode };

// react-fast-marquee is CJS. Vite/esbuild may wrap it with one or two levels of .default.
// Walk the .default chain until we find a callable component.
function _resolveMarquee(m: unknown, depth = 0): React.ComponentType<FastMarqueeProps> {
  if (typeof m === "function") return m as React.ComponentType<FastMarqueeProps>;
  if (depth < 4 && m && typeof m === "object") {
    const d = (m as Record<string, unknown>).default;
    if (d !== undefined) return _resolveMarquee(d, depth + 1);
  }
  return m as React.ComponentType<FastMarqueeProps>;
}
const FastMarquee = _resolveMarquee(_FastMarqueeNs);

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  speed = 35,
  className,
  pauseOnHover = true,
}: MarqueeProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={cn("flex gap-12 overflow-x-auto", className)}>{children}</div>
    );
  }

  return (
    <FastMarquee
      speed={speed}
      pauseOnHover={pauseOnHover}
      gradient={false}
      className={className}
    >
      {children}
    </FastMarquee>
  );
}
