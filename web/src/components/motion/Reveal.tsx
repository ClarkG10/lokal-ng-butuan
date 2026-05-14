import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  delay?: number;
  children?: ReactNode;
}

export function Reveal({ delay = 0, children, ...props }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
