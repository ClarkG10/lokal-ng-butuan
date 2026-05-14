import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-base ease-soft disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-sm hover:opacity-90",
        primary:
          "bg-gold-gradient text-foreground shadow-sm hover:brightness-105 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-muted text-foreground border border-border hover:bg-muted/80",
        ghost: "text-foreground hover:bg-muted",
        outline:
          "border border-input bg-background text-foreground hover:bg-muted",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        brand:
          "bg-[#018402] text-white shadow-sm hover:bg-[#016d02] active:bg-[#015501]",
        danger:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          !asChild && "relative overflow-hidden",
          className,
        )}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {children}
            {loading && (
              <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-xl">
                <span className="absolute inset-y-0 w-2/5 animate-btn-scan bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </span>
            )}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
