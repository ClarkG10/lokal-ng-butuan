export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface EventMedia {
  id: number;
  path: string;
  url: string;
  orientation: "landscape" | "portrait";
  is_cover: boolean;
  sort_order: number;
  alt_text?: string | null;
}

export interface EventItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  status: EventStatus;
  cover_url: string | null;
  qr_token: string | null;
}

export interface Survey {
  id: number;
  slug: string;
  title: string;
  description: string;
  status: "draft" | "active" | "closed";
  qr_token: string | null;
}

export interface Announcement {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_url: string | null;
  category?: { id: number; name: string; slug: string } | null;
  published_at: string;
}
