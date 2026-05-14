import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

type ToastVariant = "default" | "success" | "error" | "info" | "warning";

interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function toast({ title = "", description, variant = "default", duration }: ToastInput) {
  const opts = {
    description,
    duration: duration ?? 4000,
  };
  switch (variant) {
    case "success":
      sonnerToast.success(title, opts);
      break;
    case "error":
      sonnerToast.error(title, opts);
      break;
    case "info":
      sonnerToast.info(title, opts);
      break;
    case "warning":
      sonnerToast.warning(title, opts);
      break;
    default:
      sonnerToast(title, opts);
  }
}

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-body text-sm rounded-lg border border-border shadow-md",
          title: "font-semibold",
          description: "text-muted-foreground text-xs",
        },
      }}
    />
  );
}
