"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

export type ProfileTab = "overview" | "stories" | "comments" | "about";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "stories", label: "Stories" },
  { id: "comments", label: "Comments" },
  { id: "about", label: "About" },
];

export function ProfileTabs({ username, current }: { username: string; current: ProfileTab }) {
  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-14 z-20 flex gap-1 border-b border-border bg-background/80 px-1 backdrop-blur"
    >
      {TABS.map((t) => {
        const active = t.id === current;
        const href = t.id === "overview" ? `/user/${username}` : `/user/${username}?tab=${t.id}`;
        return (
          <Link
            key={t.id}
            href={href}
            scroll={false}
            className={cn(
              "relative px-3 py-2 text-sm transition-colors",
              active
                ? "font-medium text-foreground after:absolute after:bottom-[-1px] after:left-2 after:right-2 after:h-[2px] after:rounded-full after:bg-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
