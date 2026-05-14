import { Link } from "react-router-dom";
import { Bell, ExternalLink, LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/AuthContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useComments } from "@/features/comments/hooks";

function NotificationsDropdown() {
  const { data: pending } = useComments({ status: "pending" });
  const count = pending?.length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-sm font-semibold">
          {count > 0 ? `${count} pending comment${count === 1 ? "" : "s"}` : "Notifications"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No pending items
          </div>
        ) : (
          pending!.slice(0, 5).map((c) => (
            <DropdownMenuItem key={c.id} asChild>
              <Link to="/admin/comments" className="flex flex-col items-start gap-0.5 py-2">
                <span className="text-sm font-medium">{c.author_name}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {c.body.length > 70 ? c.body.slice(0, 70) + "…" : c.body}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        {count > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/comments" className="justify-center text-xs font-medium text-muted-foreground">
                View all pending →
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-white/90 dark:bg-card/90 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-lg border border-border lg:hidden"
          onClick={onOpenMobile}
        >
          <Menu className="size-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> View site
          </Link>
        </Button>
        <Button variant="ghost" size="icon" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleDark}>
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <NotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted">
              <span className="grid size-8 place-items-center rounded-full bg-foreground text-background text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-tight">{user?.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {user?.roles?.[0]?.replace("_", " ")}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">
                <UserIcon className="size-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-brand-red">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
