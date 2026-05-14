import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Props {
  src: string;
  alt?: string;
  caption?: string | null;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, caption, onClose }: Props) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{
        animation: closing
          ? "lightbox-bg-out 0.22s ease both"
          : "lightbox-bg-in 0.2s ease both",
        backgroundColor: "rgba(0,0,0,0.85)",
      }}
      onClick={handleClose}
    >
      <div
        className="relative flex max-h-[92vh] max-w-[92vw] flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{
          animation: closing
            ? "lightbox-out 0.22s ease both"
            : "lightbox-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt ?? ""}
          className="max-h-[88vh] max-w-[88vw] object-contain"
        />
        {caption && (
          <p className="w-full bg-black/70 px-4 py-2 text-center text-sm text-white">
            {caption}
          </p>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
