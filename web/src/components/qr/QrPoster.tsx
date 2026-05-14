import QRCode from "react-qr-code";

export function QrPoster({
  url,
  title,
  subtitle,
  tagline = "Scan to learn more.",
  brand = "Lokal ng Butuan",
}: {
  url: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  brand?: string;
}) {
  return (
    <div
      className="print-page relative aspect-[1/1.414] w-[420px] max-w-full overflow-hidden rounded-3xl border border-border bg-white p-10 shadow-card print:shadow-none"
      style={{ pageBreakAfter: "always" }}
    >
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-yellow/40 blur-2xl" />
      <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-brand-green/30 blur-2xl" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gold-gradient font-display text-base font-bold">
            B
          </span>
          <span className="font-display text-base font-semibold">{brand}</span>
        </div>

        <div className="mt-8 grow">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">You're invited</p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="grid place-items-center rounded-2xl bg-surface p-5">
          <div className="rounded-lg bg-white p-3">
            <QRCode value={url} size={200} bgColor="#FFFFFF" fgColor="#111827" />
          </div>
          <p className="mt-4 break-all text-center text-xs text-muted-foreground">{url}</p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{tagline}</p>
      </div>
    </div>
  );
}
