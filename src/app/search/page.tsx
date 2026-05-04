import { search } from "@/lib/hn/algolia";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { readSession } from "@/lib/session";
import { relativeTime } from "@/lib/time";
import { hostFromUrl } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

const TAGS = [
  { value: "", label: "All" },
  { value: "story", label: "Stories" },
  { value: "comment", label: "Comments" },
  { value: "ask_hn", label: "Ask HN" },
  { value: "show_hn", label: "Show HN" },
  { value: "front_page", label: "Front page" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tag = sp.tag ?? "";
  const byDate = sp.sort === "date";
  const page = Number(sp.page ?? 0);

  const session = await readSession();
  void session;

  const result = q
    ? await search({
        query: q,
        tags: tag ? [tag] : undefined,
        byDate,
        page,
        hitsPerPage: 30,
      }).catch(() => null)
    : null;

  return (
    <div className="grid gap-4">
      <form action="/search" className="grid gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search Hacker News…"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search query"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {TAGS.map((t) => (
            <a
              key={t.value}
              href={`/search?${new URLSearchParams({ q, tag: t.value, sort: byDate ? "date" : "" }).toString()}`}
              className={`rounded-full px-3 py-1 border ${tag === t.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
            >
              {t.label}
            </a>
          ))}
          <span className="ml-auto inline-flex items-center gap-2 text-xs">
            <a
              href={`/search?${new URLSearchParams({ q, tag, sort: "" }).toString()}`}
              className={!byDate ? "font-semibold" : "text-muted-foreground hover:text-foreground"}
            >
              Relevance
            </a>
            <span className="text-muted-foreground">·</span>
            <a
              href={`/search?${new URLSearchParams({ q, tag, sort: "date" }).toString()}`}
              className={byDate ? "font-semibold" : "text-muted-foreground hover:text-foreground"}
            >
              Newest
            </a>
          </span>
        </div>
      </form>

      {!q ? (
        <p className="text-sm text-muted-foreground">Type a query to search HN.</p>
      ) : !result || result.hits.length === 0 ? (
        <p className="text-sm text-muted-foreground">No results.</p>
      ) : (
        <div className="grid gap-2">
          {result.hits.map((h) => {
            const isComment = !h.title && !h.url;
            const targetId = isComment ? (h.story_id ?? h.objectID) : h.objectID;
            const host = hostFromUrl(h.url);
            return (
              <article key={h.objectID} className="rounded-md border border-border bg-card p-3">
                {isComment ? (
                  <>
                    <Link
                      href={`/item/${targetId}#${h.objectID}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      comment on: {h.story_title ?? "(thread)"}
                    </Link>
                    <div
                      className="hn-text mt-1 text-sm"
                      dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(h.comment_text) }}
                    />
                  </>
                ) : (
                  <h2 className="text-base font-medium leading-snug">
                    <a
                      href={h.url ?? `/item/${h.objectID}`}
                      target={h.url ? "_blank" : undefined}
                      rel={h.url ? "noopener noreferrer" : undefined}
                      className="hover:underline"
                    >
                      {h.title}
                    </a>
                    {host ? (
                      <span className="ml-2 text-xs text-muted-foreground">({host})</span>
                    ) : null}
                  </h2>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {h.points ? `${h.points} points · ` : ""}
                  {h.author ? `by ${h.author} · ` : ""}
                  {h.created_at_i ? relativeTime(h.created_at_i) : ""}
                  {typeof h.num_comments === "number" ? (
                    <>
                      {" · "}
                      <Link href={`/item/${targetId}`} className="hover:text-foreground">
                        {h.num_comments} comments
                      </Link>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
          <Pagination
            q={q}
            tag={tag}
            sort={byDate ? "date" : ""}
            page={page}
            totalPages={result.nbPages}
          />
        </div>
      )}
    </div>
  );
}

function Pagination({
  q,
  tag,
  sort,
  page,
  totalPages,
}: {
  q: string;
  tag: string;
  sort: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-sm">
      {page > 0 ? (
        <Link
          href={`/search?${new URLSearchParams({ q, tag, sort, page: String(page - 1) }).toString()}`}
          className="rounded border border-border px-3 py-1 hover:bg-accent"
        >
          ← Prev
        </Link>
      ) : null}
      <span className="text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>
      {page + 1 < totalPages ? (
        <Link
          href={`/search?${new URLSearchParams({ q, tag, sort, page: String(page + 1) }).toString()}`}
          className="rounded border border-border px-3 py-1 hover:bg-accent"
        >
          Next →
        </Link>
      ) : null}
    </div>
  );
}
