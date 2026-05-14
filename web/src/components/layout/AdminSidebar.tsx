import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Megaphone,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Settings,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "content_manager", "moderator", "analytics_viewer"], end: true },
  { to: "/admin/events", label: "Events", icon: CalendarDays, roles: ["super_admin", "content_manager"] },
  { to: "/admin/surveys", label: "Surveys", icon: ClipboardList, roles: ["super_admin", "content_manager"] },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone, roles: ["super_admin", "content_manager"] },
  { to: "/admin/gallery", label: "Gallery", icon: Images, roles: ["super_admin", "content_manager"] },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare, roles: ["super_admin", "content_manager", "moderator"] },
  { to: "/admin/masterlists", label: "Masterlists", icon: Users, roles: ["super_admin", "content_manager", "analytics_viewer"] },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "content_manager", "moderator", "analytics_viewer"] },
  { to: "/admin/users", label: "Users", icon: ShieldCheck, roles: ["super_admin"] },
  { to: "/admin/settings", label: "Settings", icon: Settings, roles: ["super_admin", "content_manager", "moderator", "analytics_viewer"] },
];

export function AdminSidebar({ hasRole }: { hasRole: (...r: string[]) => boolean }) {
  return (
    <aside className="hidden border-r border-border bg-white dark:bg-card lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground font-display text-base font-bold text-background">
            B
          </span>
          <span className="font-display text-base font-semibold">Lokal ng Butuan</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        {NAV.filter((item) => hasRole(...item.roles)).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background dark:bg-white dark:text-zinc-900"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-muted px-4 py-3">
          <p className="text-xs font-semibold">Admin Console</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your church experience.
          </p>
        </div>
      </div>
    </aside>
  );
}
