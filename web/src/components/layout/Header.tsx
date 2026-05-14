import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import { usePublicAuth } from "@/contexts/PublicAuthContext";
import type React from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Events" },
  { to: "/surveys", label: "Surveys" },
  { to: "/announcements", label: "Announcements" },
  { to: "/gallery", label: "Gallery" },
];

export function Header() {
  const { lang, toggle } = useLang();
  const { publicUser, logout: publicLogout } = usePublicAuth();
  /** mobileVisible — controls DOM presence of the overlay */
  const [mobileVisible, setMobileVisible] = useState(false);
  /** mobileOpen — triggers the clip-path CSS transition */
  const [mobileOpen, setMobileOpen] = useState(false);

  const openNav = () => {
    setMobileVisible(true);
    // Two rAFs so the element is painted before we transition
    requestAnimationFrame(() => requestAnimationFrame(() => setMobileOpen(true)));
  };

  const closeNav = () => {
    setMobileOpen(false);
    // Remove from DOM after the 800ms clip-path transition finishes
    setTimeout(() => setMobileVisible(false), 850);
  };

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = mobileVisible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileVisible]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-md dark:bg-card/90">
        {/* Brand tri-color accent bar */}
        <div aria-hidden className="h-[3px] bg-gradient-to-r from-brand-green via-brand-yellow to-brand-red" />
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-gold-gradient font-display text-base font-bold">
              B
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight">Lokal ng Butuan City</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Iglesia ni Cristo</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-brand-green",
                    isActive && "text-brand-green font-semibold",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {/* Language toggle — subtle pill */}
            <button
              type="button"
              onClick={toggle}
              aria-label={`Switch to ${lang === "en" ? "Tagalog" : "English"}`}
              className="flex items-center gap-px rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors hover:border-brand-green/40 hover:bg-brand-green/5"
            >
              <span className={cn("px-1 transition-colors", lang === "en" ? "text-brand-green" : "text-muted-foreground")}>EN</span>
              <span className="text-border">|</span>
              <span className={cn("px-1 transition-colors", lang === "tl" ? "text-brand-green" : "text-muted-foreground")}>TL</span>
            </button>

            {/* Signed-in member pill — name + logout in one element */}
            {publicUser && (
              <div className="flex items-center overflow-hidden rounded-full border border-brand-green/25 bg-brand-green/5">
                <span className="flex items-center gap-1.5 py-1.5 pl-3 pr-2.5 text-xs font-medium text-brand-green">
                  <User className="size-3 shrink-0" />
                  {publicUser.first_name} {publicUser.last_name}
                </span>
                <button
                  type="button"
                  onClick={publicLogout}
                  title="Sign out"
                  className="flex items-center border-l border-brand-green/20 px-2.5 py-1.5 text-brand-green/50 transition-colors hover:bg-brand-green/10 hover:text-brand-green"
                >
                  <LogOut className="size-3" />
                </button>
              </div>
            )}

            <Button asChild size="sm" variant="brand">
              <Link to="/events">Explore Events</Link>
            </Button>
          </div>

          {/* Mobile hamburger — renders X once overlay is visible */}
          <button
            type="button"
            aria-label={mobileVisible ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="grid size-10 place-items-center rounded-lg border border-border transition-colors hover:bg-muted md:hidden"
            onClick={mobileVisible ? closeNav : openNav}
          >
            {mobileVisible
              ? <X className="size-5" />
              : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* ── Triangle mobile nav overlay ───────────────────────────── */}
      {mobileVisible && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal
          aria-label="Navigation menu"
        >
          {/* ① Green full-screen background — always present behind triangles */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, #016d02 0%, #018402 50%, #01a003 100%)" }}
          />

          {/*
            ② White triangles sit on top of the green.
               They start covering the full screen (= you see white, no green).
               When mobileOpen→true they collapse to their respective edges,
               REVEALING the green background and the nav content beneath.
          */}

          {/* Left white triangle → collapses left */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: "hsl(var(--background))",
              clipPath: mobileOpen
                ? "polygon(0 0, 0 100%, 0 100%)"       /* collapsed to left edge */
                : "polygon(0 0, 0% 100%, 100% 100%)",  /* covers bottom-left half */
              transition: "clip-path 800ms cubic-bezier(0.645, 0.045, 0.355, 1)",
            }}
          />

          {/* Right white triangle → collapses right */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: "hsl(var(--background))",
              clipPath: mobileOpen
                ? "polygon(100% 0, 100% 0, 100% 100%)"  /* collapsed to right edge */
                : "polygon(100% 0, 0 0, 100% 100%)",     /* covers top-right half */
              transition: "clip-path 800ms cubic-bezier(0.645, 0.045, 0.355, 1)",
            }}
          />

          {/* ③ Nav links — stagger-animated once triangles have opened */}
          {mobileOpen && (
            <nav
              className="absolute inset-0 flex flex-col items-center justify-center gap-1"
              aria-label="Mobile navigation"
            >
              {NAV.map((item, i) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={closeNav}
                  style={{
                    animation: "mobile-nav-in 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) both",
                    animationDelay: `${0.7 + i * 0.1}s`,
                  } as React.CSSProperties}
                  className={({ isActive }) =>
                    cn(
                      "py-3 font-display text-3xl font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-70",
                      isActive && "opacity-70 underline underline-offset-[12px] decoration-2 decoration-brand-yellow",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* CTA */}
              <div
                style={{
                  animation: "mobile-nav-in 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) both",
                  animationDelay: `${0.7 + NAV.length * 0.1}s`,
                } as React.CSSProperties}
                className="mt-6"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-white font-semibold text-brand-green hover:bg-white/90"
                >
                  <Link to="/events" onClick={closeNav}>Explore Events</Link>
                </Button>
              </div>

              {/* EN/TL language toggle */}
              <div
                style={{
                  animation: "mobile-nav-in 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) both",
                  animationDelay: `${0.7 + (NAV.length + 1) * 0.1}s`,
                } as React.CSSProperties}
                className="mt-4"
              >
                <button
                  type="button"
                  onClick={() => { toggle(); closeNav(); }}
                  aria-label={`Switch to ${lang === "en" ? "Tagalog" : "English"}`}
                  className="flex items-center gap-px rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white/20"
                >
                  <span className={cn("px-1.5 transition-colors", lang === "en" ? "text-brand-yellow" : "text-white/60")}>EN</span>
                  <span className="text-white/30">|</span>
                  <span className={cn("px-1.5 transition-colors", lang === "tl" ? "text-brand-yellow" : "text-white/60")}>TL</span>
                </button>
              </div>

              {/* Public user sign-in / signed-in state */}
              <div
                style={{
                  animation: "mobile-nav-in 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) both",
                  animationDelay: `${0.7 + (NAV.length + 2) * 0.1}s`,
                } as React.CSSProperties}
                className="mt-3"
              >
                {publicUser ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm text-white/80">
                      Signed in as <span className="font-semibold text-white">{publicUser.first_name} {publicUser.last_name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => { publicLogout(); closeNav(); }}
                      className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeNav}
                    className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                  >
                    Sign in as Member
                  </Link>
                )}
              </div>
            </nav>
          )}

          {/* ④ Close button top-right, fades in after triangles open */}
          {mobileOpen && (
            <button
              type="button"
              aria-label="Close navigation"
              onClick={closeNav}
              style={{
                animation: "mobile-nav-in 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) both",
                animationDelay: "1.1s",
              } as React.CSSProperties}
              className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30 transition-colors hover:bg-white/30"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
