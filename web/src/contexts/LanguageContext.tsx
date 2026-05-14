import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "tl";

interface LangCtx {
  lang: Lang;
  toggle: () => void;
}

const LanguageContext = createContext<LangCtx>({
  lang: "en",
  toggle: () => {},
});

export const useLang = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <LanguageContext.Provider
      value={{ lang, toggle: () => setLang((l) => (l === "en" ? "tl" : "en")) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
