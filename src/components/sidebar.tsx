import { DatePickerButton } from "@/components/date-picker";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  Briefcase,
  Clock,
  Flame,
  HelpCircle,
  History,
  Home,
  MessageSquare,
  Sparkles,
  Star,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  authed?: boolean;
}

const PRIMARY: NavItem[] = [
  { href: "/", label: "Top", icon: <Home className="size-4" /> },
  { href: "/new", label: "New", icon: <Sparkles className="size-4" /> },
  { href: "/best", label: "Best", icon: <Flame className="size-4" /> },
  { href: "/ask", label: "Ask", icon: <HelpCircle className="size-4" /> },
  { href: "/show", label: "Show", icon: <Star className="size-4" /> },
  { href: "/jobs", label: "Jobs", icon: <Briefcase className="size-4" /> },
];

const PERSONAL: NavItem[] = [
  { href: "/threads", label: "Threads", icon: <MessageSquare className="size-4" />, authed: true },
  { href: "/favorites", label: "Favorites", icon: <Star className="size-4" />, authed: true },
  { href: "/upvoted", label: "Upvoted", icon: <ThumbsUp className="size-4" />, authed: true },
  { href: "/submitted", label: "Submitted", icon: <History className="size-4" />, authed: true },
];

const LOCAL: NavItem[] = [
  { href: "/bookmarks", label: "Bookmarks", icon: <Bookmark className="size-4" /> },
  { href: "/history", label: "History", icon: <Clock className="size-4" /> },
];

export function Sidebar({
  loggedIn,
  pathname,
}: {
  loggedIn: boolean;
  pathname?: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex md:w-56 md:shrink-0 md:flex-col gap-6 border-r border-border bg-card/40 px-3 py-6 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto"
    >
      <Section label="Feeds">
        {PRIMARY.map((it) => (
          <NavLink key={it.href} item={it} active={pathname === it.href} />
        ))}
      </Section>
      {loggedIn ? (
        <Section label="You">
          {PERSONAL.map((it) => (
            <NavLink key={it.href} item={it} active={pathname === it.href} />
          ))}
        </Section>
      ) : null}
      <Section label="Local">
        {LOCAL.map((it) => (
          <NavLink key={it.href} item={it} active={pathname === it.href} />
        ))}
        <li className="px-3 pt-1">
          <DatePickerButton />
        </li>
      </Section>
      <Section label="Misc">
        <a
          href="/rss"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          RSS
        </a>
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Settings
        </Link>
      </Section>
    </nav>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          active && "bg-accent text-accent-foreground font-medium",
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    </li>
  );
}
