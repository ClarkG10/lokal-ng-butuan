import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Send, MessageCircle, Link2, Check } from "lucide-react";
import { useAnnouncement } from "@/features/announcements/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

function ShareBar({ title, excerpt, slug }: { title: string; excerpt: string | null; slug: string }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = `${window.location.origin}/announcements/${slug}`;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  const mailBody = encodeURIComponent(`${excerpt ? excerpt + "\n\n" : ""}Read more: ${pageUrl}`);

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openMessenger = async () => {
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.href = `fb-messenger://share/?link=${encodedUrl}`;
    } else {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Share this announcement
      </p>
      <div className="flex flex-wrap gap-3">
        {/* Email → Gmail compose */}
        <a
          href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedTitle}&body=${mailBody}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface hover:border-brand-red hover:text-brand-red"
        >
          <Mail className="size-4" />
          Email
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-[#229ED9]/10 hover:border-[#229ED9] hover:text-[#229ED9]"
        >
          <Send className="size-4" />
          Telegram
        </a>

        {/* Facebook Messenger */}
        <button
          type="button"
          onClick={openMessenger}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-[#0084FF]/10 hover:border-[#0084FF] hover:text-[#0084FF]"
        >
          <MessageCircle className="size-4" />
          Messenger
        </button>

        {/* Copy link */}
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface"
        >
          {copied ? <Check className="size-4 text-brand-green" /> : <Link2 className="size-4" />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Messenger opens the app on mobile. On desktop, the link is copied — paste it in Messenger.
      </p>
    </div>
  );
}

export default function AnnouncementDetailPage() {
  const { slug } = useParams();
  const { data, isLoading } = useAnnouncement(slug);

  if (isLoading) {
    return (
      <div className="container-page section-y max-w-3xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <Skeleton className="h-4 w-36" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container-page section-y">
        <h1 className="font-display text-3xl font-bold">Announcement not found</h1>
        <Link
          to="/announcements"
          className="mt-4 inline-flex items-center gap-2 text-sm text-brand-red"
        >
          <ArrowLeft className="size-4" /> Back to announcements
        </Link>
      </div>
    );
  }

  /* Detect if body_rich is HTML (starts with a tag) or plain text */
  const isHtml = data.body_rich?.trimStart().startsWith("<");

  return (
    <div className="container-page section-y max-w-3xl">
      <Link
        to="/announcements"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to announcements
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          {data.category && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
              {data.category.name}
            </span>
          )}
          {data.published_at && (
            <span className="text-sm text-muted-foreground">{formatDateTime(data.published_at)}</span>
          )}
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight">
          {data.title}
        </h1>
        {data.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{data.excerpt}</p>
        )}
      </header>

      {(data.body_rich || data.excerpt) && (
        <div className="mt-2 border-t border-border" />
      )}

      {data.body_rich && (
        <div className="mt-8 text-base leading-relaxed text-foreground">
          {isHtml ? (
            /* eslint-disable-next-line react/no-danger */
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: data.body_rich }}
            />
          ) : (
            <p className="whitespace-pre-line">{data.body_rich}</p>
          )}
        </div>
      )}

      <ShareBar title={data.title} excerpt={data.excerpt} slug={data.slug} />
    </div>
  );
}
