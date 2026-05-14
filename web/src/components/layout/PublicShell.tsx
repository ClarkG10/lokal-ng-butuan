import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import HomePageTransition from "./HomePageTransition";

export function PublicShell() {
  /**
   * starts as `true` so the page content is invisible until the
   * initial loader finishes; toggled by HomePageTransition callbacks.
   */
  const [transitioning, setTransitioning] = useState(true);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: "hsl(var(--background))",
        backgroundImage: [
          "radial-gradient(circle at 20% 10%, rgba(1,132,2,0.04) 0%, transparent 50%)",
          "radial-gradient(circle at 80% 80%, rgba(214,180,82,0.05) 0%, transparent 50%)",
          "radial-gradient(circle, rgba(1,132,2,0.035) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "100% 100%, 100% 100%, 28px 28px",
      }}
    >
      <ScrollToTop />
      <HomePageTransition
        onStart={() => setTransitioning(true)}
        onEnd={() => setTransitioning(false)}
      />
      <Header />
      {/*
        Content wrapper: hidden (opacity 0, shifted down) while transitioning,
        then crossfades upward into view once the overlay begins to fade.
        Both main + footer are wrapped so no content flashes during transitions.
      */}
      <div
        className="flex flex-1 flex-col"
        style={{
          opacity:    transitioning ? 0 : 1,
          // "none" (not translateY(0)) so we don't create a CSS stacking
          // context after the animation ends — otherwise the lightbox z-index
          // gets trapped inside and the sticky header paints above it.
          transform:  transitioning ? "translateY(12px)" : "none",
          transition: transitioning
            ? "none"
            : "opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
