import { Link } from "react-router-dom";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-brand-green text-white shadow-[0_-8px_32px_-4px_rgba(1,132,2,0.25)]">
      <div className="container-page grid gap-12 py-16 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-gold-gradient font-display text-base font-bold text-foreground">
              B
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold text-white">Lokal ng Butuan City</span>
              <span className="text-xs font-medium uppercase tracking-widest text-white/60">Iglesia ni Cristo · Agusan del Norte</span>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
            Ang opisyal na digital na plataporma ng Iglesia ni Cristo — Lokal ng Butuan City sa Agusan del Norte para sa mga kaganapan, pakikipag-ugnayan ng komunidad, at mga sandali ng pananampalataya.
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
            The official digital platform of the Iglesia ni Cristo — Lokal ng Butuan City, Agusan del Norte — for events, community engagement, and shared moments of faith.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-sm font-semibold text-white">
            I-explore <span className="font-normal text-white/50">/ Explore</span>
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/events" className="text-white/70 hover:text-white">
                Mga Kaganapan <span className="text-white/40">/ Events</span>
              </Link>
            </li>
            <li>
              <Link to="/surveys" className="text-white/70 hover:text-white">
                Mga Survey <span className="text-white/40">/ Surveys</span>
              </Link>
            </li>
            <li>
              <Link to="/announcements" className="text-white/70 hover:text-white">
                Mga Anunsyo <span className="text-white/40">/ Announcements</span>
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="text-white/70 hover:text-white">
                Galeriya <span className="text-white/40">/ Gallery</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Visit info */}
        <div>
          <h4 className="text-sm font-semibold text-white">
            Bisita <span className="font-normal text-white/50">/ Visit</span>
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <span className="block font-medium text-white/90">Serbisyo ng Pagsamba</span>
              <span className="text-white/50">Worship Service</span>
            </li>
            <li>
              <span className="block text-white/70">Huwebes at Linggo</span>
              <span className="text-white/50">Thursday &amp; Sunday</span>
            </li>
            <li>
              <span className="block text-white/70">Butuan City, Agusan del Norte</span>
              <span className="text-white/50">Philippines</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 md:flex-row">
          <p>
            © {year} Iglesia ni Cristo — Lokal ng Butuan City.{" "}
            <span className="text-white/30">Lahat ng karapatan ay nakalaan · All rights reserved.</span>
          </p>
          <p>
            Ginawa nang may pagmamahal para sa aming mga kaanib.{" "}
            <span className="text-white/30">Made with care for our members.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
