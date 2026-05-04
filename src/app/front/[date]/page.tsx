import { DatePickerButton } from "@/components/date-picker";
import { StoryCard } from "@/components/story-card";
import { search } from "@/lib/hn/algolia";
import type { RawItem } from "@/lib/hn/types";
import { readSession } from "@/lib/session";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  return { title: `Front page · ${date}` };
}

export default async function FrontPage({ params }: PageProps) {
  const { date } = await params;
  const m = ISO_DATE.exec(date);
  if (!m) notFound();
  const [, y, mo, d] = m;
  const dateUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(dateUtc)) notFound();

  const start = Math.floor(dateUtc / 1000);
  const end = start + 86400;

  const session = await readSession();
  const loggedIn = !!session?.username;

  const res = await search({
    tags: ["front_page"],
    numericFilters: [`created_at_i>=${start}`, `created_at_i<${end}`],
    byDate: true,
    hitsPerPage: 30,
  });

  const items: RawItem[] = (res.hits ?? []).map((h) => ({
    id: Number(h.objectID),
    type: "story",
    by: h.author,
    time: h.created_at_i,
    title: h.title,
    url: h.url,
    score: h.points ?? undefined,
    descendants: h.num_comments ?? 0,
  }));

  const prev = shiftDay(date, -1);
  const next = shiftDay(date, +1);
  const isToday = end > Math.floor(Date.now() / 1000);

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Front page on {date}</h1>
          <p className="text-xs text-muted-foreground">
            Historical snapshot from Algolia. Voting is on{" "}
            <a
              href="https://news.ycombinator.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              the live HN page
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/front/${prev}`}
            className="inline-flex items-center rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <ChevronLeft className="size-3" /> {prev}
          </Link>
          <DatePickerButton initialDate={date} />
          {isToday ? (
            <span className="text-xs text-muted-foreground px-2">today</span>
          ) : (
            <Link
              href={`/front/${next}`}
              className="inline-flex items-center rounded border border-border px-2 py-1 text-xs hover:bg-accent"
            >
              {next} <ChevronRight className="size-3" />
            </Link>
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No front-page hits for this date.
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((it, i) => (
            <StoryCard key={it.id} item={it} rank={i + 1} loggedIn={loggedIn} historicalSnapshot />
          ))}
        </div>
      )}
    </div>
  );
}

function shiftDay(date: string, by: number): string {
  const m = ISO_DATE.exec(date);
  if (!m) return date;
  const [, y, mo, d] = m;
  const dt = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  dt.setUTCDate(dt.getUTCDate() + by);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
