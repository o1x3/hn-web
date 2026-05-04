import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { Search } from "lucide-react";
import Link from "next/link";

export function Header({ username }: { username: string | null }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Home"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            Y
          </span>
          <span className="hidden sm:inline">hn-reddit</span>
        </Link>

        <form action="/search" className="ml-2 hidden max-w-md flex-1 items-center gap-2 sm:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Search HN…"
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search Hacker News"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/submit">Submit</Link>
          </Button>
          <ThemeToggle />
          <UserMenu username={username} />
        </div>
      </div>
    </header>
  );
}
