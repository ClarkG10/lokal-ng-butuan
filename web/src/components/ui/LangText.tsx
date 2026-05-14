import { useEffect, useState, type ReactNode } from "react";
import { useLang, type Lang } from "@/contexts/LanguageContext";

interface Props {
  en: ReactNode;
  tl: ReactNode;
  className?: string;
}

/**
 * Renders English or Tagalog content based on the active language, with a
 * smooth crossfade (fade-out → swap text → fade-in) on language change.
 *
 * Usage:
 *   <p><LangText en="English text" tl="Tagalog text" /></p>
 *
 * For block-level content, wrap in a <div> or <p> and let LangText render
 * the inner <span>. For multi-line richtext, pass JSX as the `en`/`tl` props.
 */
export function LangText({ en, tl, className }: Props) {
  const { lang } = useLang();
  const [shown, setShown] = useState<Lang>(lang);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setFading(true);
    const t = setTimeout(() => {
      setShown(lang);
      setFading(false);
    }, 140);
    return () => clearTimeout(t);
  }, [lang]);

  return (
    <span
      className={className}
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.14s ease-out" : "opacity 0.22s ease-in",
        display: "inline",
      }}
    >
      {shown === "en" ? en : tl}
    </span>
  );
}
