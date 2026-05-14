import { useRef } from "react";
import { QRCode } from "react-qr-code";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface QrModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
}

export function QrModal({ open, onClose, url, title, subtitle }: QrModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const size = 400;
    const padding = 32;
    const total = size + padding * 2;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = total;
      canvas.height = total;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, total, total);

      // Draw QR centered with padding
      ctx.drawImage(img, padding, padding, size, size);

      const a = document.createElement("a");
      a.download = `qr-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription className={subtitle ? undefined : "sr-only"}>{subtitle ?? title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <div
            ref={qrRef}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <QRCode value={url} size={220} />
          </div>

          <p className="max-w-[220px] text-center text-xs text-muted-foreground break-all">{url}</p>

          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="size-4" /> Download PNG
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigator.clipboard.writeText(url)}
            >
              Copy link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
