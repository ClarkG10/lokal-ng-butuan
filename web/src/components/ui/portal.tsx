import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/** Renders children at document.body, bypassing any CSS stacking-context ancestors. */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
