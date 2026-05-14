import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/types/domain";

const LABEL: Record<EventStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Happening Now",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge tone={status}>{LABEL[status]}</Badge>;
}
