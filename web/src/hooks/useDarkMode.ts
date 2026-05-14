import { useCallback, useEffect, useRef, useState } from "react";

const DARK_EVENT = "app:darkmode";

function getInitial(): boolean {
  try {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitial);
  const isFirstRender = useRef(true);

  /* Apply class + persist */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  /* Broadcast to other hook instances (deferred so it runs outside render) */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.dispatchEvent(new CustomEvent<boolean>(DARK_EVENT, { detail: isDark }));
  }, [isDark]);

  /* Listen for broadcasts from other instances */
  useEffect(() => {
    const handler = (e: Event) => {
      setIsDark((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener(DARK_EVENT, handler);
    return () => window.removeEventListener(DARK_EVENT, handler);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggle };
}
