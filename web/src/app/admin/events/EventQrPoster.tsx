import { useRef } from "react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export function EventQrPoster({
  token,
  title,
  startsAt,
}: {
  token: string;
  title: string;
  startsAt: string;
}) {
  const apiRoot = (import.meta.env.VITE_API_BASE as string ?? "http://localhost:8000/api/v1")
    .replace(/\/api\/v1\/?$/, "");
  const url = `${apiRoot}/q/${token}`;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svgEl = cardRef.current?.querySelector("svg");
    if (!svgEl) return;

    const size = 320;
    const pad = 32;
    const titleH = 48;
    const subtitleH = 20;
    const footerH = 40;
    const totalW = size + pad * 2;
    const totalH = titleH + size + pad * 2 + subtitleH + footerH;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = totalW * 2; // 2× for retina
      canvas.height = totalH * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, totalW, totalH);

      // Title
      ctx.fillStyle = "#111827";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title.length > 48 ? title.slice(0, 48) + "…" : title, totalW / 2, 28);

      // Subtitle (date)
      ctx.fillStyle = "#6B7280";
      ctx.font = "12px sans-serif";
      ctx.fillText(formatDateTime(startsAt), totalW / 2, 48);

      // QR
      ctx.drawImage(img, pad, titleH + pad / 2, size, size);

      // URL
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "9px monospace";
      const shortUrl = url.length > 60 ? url.slice(0, 60) + "…" : url;
      ctx.fillText(shortUrl, totalW / 2, titleH + pad / 2 + size + 24);

      // Footer brand
      ctx.fillStyle = "#018402";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("Iglesia ni Cristo · Lokal ng Butuan City", totalW / 2, titleH + pad / 2 + size + 44);

      const a = document.createElement("a");
      a.download = `qr-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 print-hidden">
        <div>
          <h3 className="text-base font-semibold">Event QR Code</h3>
          <p className="text-xs text-muted-foreground">Download or print the QR code for this event.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="size-4" /> Download PNG
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </div>

      {/* QR Card preview */}
      <div ref={cardRef} className="mx-auto w-fit rounded-2xl border border-border bg-white p-8 text-center shadow-sm print:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-green">Iglesia ni Cristo</p>
        <p className="mt-0.5 font-display text-base font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(startsAt)}</p>
        <div className="mt-5 inline-block rounded-xl bg-white p-2">
          <QRCode value={url} size={220} bgColor="#FFFFFF" fgColor="#111827" />
        </div>
        <p className="mt-3 break-all text-[10px] text-muted-foreground">{url}</p>
      </div>
    </Card>
  );
}
