import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { LangText } from "@/components/ui/LangText";

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Soft brand wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 0%, rgba(214,180,82,0.18) 0%, rgba(214,180,82,0) 60%), radial-gradient(50% 50% at 0% 30%, rgba(1,132,2,0.10) 0%, rgba(1,132,2,0) 60%)",
        }}
      />

      <div className="container-page section-y">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
        >
          <Sparkles className="size-3.5 text-brand-red" aria-hidden />
          <LangText en="A new season of gathering" tl="Bagong kabanata ng pagtitipon" />
        </motion.div>

        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="text-hero mt-6 max-w-5xl font-display font-bold"
        >
          <LangText
            en={<>Where the <span className="mx-2 inline-block -rotate-1 rounded-2xl bg-gold-gradient px-3 py-0 align-middle">community</span> comes together.</>}
            tl={<>Sama-sama, <span className="mx-2 inline-block -rotate-1 rounded-2xl bg-gold-gradient px-3 py-0 align-middle">bilang isa.</span></>}
          />
        </motion.h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          <LangText
            en="Discover upcoming events, join surveys with a quick scan, and stay close to the moments that shape our community."
            tl="Alamin ang mga paparating na gawain, sumali sa mga survey, at manatiling konektado sa mga sandaling humuhubog sa ating komunidad."
          />
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Button asChild size="lg" variant="brand">
            <Link to="/events">
              <LangText en="See upcoming events" tl="Tingnan ang mga gawain" /> <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/surveys">
              <LangText en="Join a survey" tl="Sumali sa survey" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
