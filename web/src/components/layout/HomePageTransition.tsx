import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Phases
 *  spinning  — initial load: opaque white bg + pulsing brand logo spinner
 *  expanding — initial load: green circle wipes the full screen
 *  covering  — route change: instant solid-green cover applied via
 *              useLayoutEffect so the overlay is in place before the browser
 *              ever paints the new page content
 *  fading    — overlay opacity → 0; onEnd() fires simultaneously so the page
 *              content crossfades in beneath the departing overlay
 *  idle      — component returns null
 */
type Phase = "idle" | "spinning" | "covering" | "expanding" | "fading";

interface Props {
  /** Called when a sequence starts — use to hide page content */
  onStart?: () => void;
  /** Called when fading begins — use to start the content fade-in crossfade */
  onEnd?: () => void;
}

export default function HomePageTransition({ onStart, onEnd }: Props) {
  const { pathname } = useLocation();
  const prevPath = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>("spinning");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // ── Initial page load ──────────────────────────────────────────────────────
  // Regular useEffect is fine: phase starts as "spinning" so the opaque white
  // backdrop is already rendered on the very first frame, before any effect runs.
  useEffect(() => {
    onStart?.();
    timers.current.push(setTimeout(() => setPhase("expanding"), 900));
    // fading + onEnd simultaneously → content starts crossfading in below overlay
    timers.current.push(setTimeout(() => { setPhase("fading"); onEnd?.(); }, 1300));
    timers.current.push(setTimeout(() => setPhase("idle"), 1750));
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Route changes ──────────────────────────────────────────────────────────
  // MUST be useLayoutEffect: fires synchronously after React commits the new
  // Outlet DOM but BEFORE the browser paints.  Both setPhase("covering") and
  // the setTransitioning(true) triggered by onStart() are flushed in the same
  // paint frame, so the new page content is never visible before the overlay.
  useLayoutEffect(() => {
    if (prevPath.current === null) { prevPath.current = pathname; return; }
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    clear();
    onStart?.();
    setPhase("covering");                                    // instant green cover
    timers.current.push(setTimeout(() => {                  // hold 120ms → crossfade
      setPhase("fading");
      onEnd?.();
    }, 120));
    timers.current.push(setTimeout(() => setPhase("idle"), 600));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (phase === "idle") return null;

  const isSpinning  = phase === "spinning";
  const isCovering  = phase === "covering";
  const isExpanding = phase === "expanding";
  const isFading    = phase === "fading";

  return (
    <>
      {/* ── White opaque backdrop (spinner phase only) ────────────────────── */}
      {/* Keeps the page hidden while the brand logo spinner plays.           */}
      {/* Fades out just as the green circle starts expanding.                */}
      <div
        aria-hidden
        className="fixed inset-0 z-[199] bg-background"
        style={{
          opacity:    isSpinning ? 1 : 0,
          transition: isExpanding ? "opacity 0.2s ease-in" : "none",
        }}
      />

      {/* ── Main overlay ──────────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        aria-label="Loading"
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
        style={{
          opacity:         isFading ? 0 : 1,
          transition:      isFading ? "opacity 0.45s ease-in-out" : "none",
          pointerEvents:   isFading ? "none" : "auto",
          // Solid green for covering/fading so the colour block fades cleanly;
          // transparent for spinning/expanding (the circle or white backdrop cover).
          backgroundColor: (isCovering || isFading) ? "#018402" : "transparent",
        }}
      >
        {/* ── Pulsing brand logo spinner (initial load only) ──────────────── */}
        {isSpinning && (
          <div className="relative flex items-center justify-center">
            {[0, 0.5, 1].map((delay, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-brand-green"
                style={{
                  width: 56,
                  height: 56,
                  opacity: 0,
                  animation: "pulse-out 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
            <div className="relative z-10 grid size-14 place-items-center rounded-2xl bg-brand-green text-white shadow-lg">
              <span className="font-display text-3xl font-black select-none">B</span>
            </div>
          </div>
        )}

        {/* ── Green circle wipe (initial load: spinning → expanding) ────────── */}
        {/* Excluded from "covering" phase so it doesn't interfere with the    */}
        {/* instant full-screen cover used for route changes.                  */}
        {!isCovering && (
          <div
            style={{
              position:        "absolute",
              width:           "48px",
              height:          "48px",
              borderRadius:    "50%",
              backgroundColor: "#018402",
              transform:       (isExpanding || isFading) ? "scale(160)" : "scale(0)",
              transition:      isExpanding
                ? "transform 0.45s cubic-bezier(0.46, 0.03, 0.52, 0.96)"
                : "none",
            }}
          />
        )}

        {/* ── Brand mark centred on green flash ───────────────────────────── */}
        {isExpanding && (
          <div
            className="relative z-10 flex flex-col items-center gap-3 text-white text-center"
            style={{ animation: "stagger-entry 0.4s 0.1s both" }}
          >
            <div className="grid size-16 place-items-center rounded-2xl bg-white/20 ring-2 ring-white/30">
              <span className="font-display text-3xl font-black select-none">B</span>
            </div>
            <p className="font-display text-xl font-bold tracking-tight">Lokal ng Butuan</p>
            <p className="text-xs uppercase tracking-widest text-white/60">Community Platform</p>
          </div>
        )}
      </div>
    </>
  );
}
