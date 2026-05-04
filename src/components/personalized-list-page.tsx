import { hnFetchText } from "@/lib/fetcher";
import { type PersonalizedRow, parsePersonalizedPage } from "@/lib/hn/scrape";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { readSession } from "@/lib/session";
import Link from "next/link";

const HN = "https://news.ycombinator.com";

/**
 * Renders one of /threads, /favorites, /upvoted, /submitted.
 *
 * FRAGILE: scrapes HN HTML with selectors that will break if HN tweaks
 * markup. See lib/hn/scrape.ts.
 */
export async function PersonalizedListPage({
  path,
  title,
  requiresUser,
}: {
  /** "/threads" | "/favorites" | "/upvoted" | "/submitted" */
  path: string;
  title: string;
  requiresUser?: boolean;
}) {
  const session = await readSession();
  if (requiresUser && !session?.username) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your HN account to see your {title.toLowerCase()}.
        </p>
      </div>
    );
  }

  const username = session?.username ?? "";
  const url = `${HN}${path}?id=${encodeURIComponent(username)}`;
  const headers = session?.hnCookie ? { Cookie: `user=${session.hnCookie}` } : undefined;

  let rows: PersonalizedRow[] = [];
  let error: string | null = null;
  try {
    const html = await hnFetchText(url, { headers });
    rows = parsePersonalizedPage(html);
  } catch (e) {
    error = e instanceof Error ? e.message : "Fetch failed";
  }

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-muted-foreground">
          For {username}. Source:{" "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            {url}
          </a>
        </p>
      </header>
      {error ? (
        <p className="text-sm text-destructive">Failed to load: {error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <article key={r.id} className="rounded-md border border-border bg-card p-3">
              {r.type === "story" ? (
                <>
                  <h2 className="text-base font-medium leading-snug">
                    <a
                      href={r.url ?? `/item/${r.id}`}
                      target={r.url ? "_blank" : undefined}
                      rel={r.url ? "noopener noreferrer" : undefined}
                      className="hover:underline"
                    >
                      {r.title}
                    </a>
                  </h2>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.score != null ? `${r.score} points` : ""}
                    {r.author ? ` · by ${r.author}` : ""}
                    {r.ageText ? ` · ${r.ageText.trim()}` : ""}
                    {r.commentCount != null ? (
                      <>
                        {" · "}
                        <Link href={`/item/${r.id}`} className="hover:text-foreground">
                          {r.commentCount} comments
                        </Link>
                      </>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href={`/item/${r.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    permalink
                  </Link>
                  <div
                    className="hn-text mt-1 text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(r.text) }}
                  />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.author ? `by ${r.author}` : ""}
                    {r.ageText ? ` · ${r.ageText.trim()}` : ""}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
