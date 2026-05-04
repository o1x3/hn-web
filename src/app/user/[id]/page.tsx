import { HistoryRecorder } from "@/components/history-recorder";
import { StoryCard } from "@/components/story-card";
import { getAlgoliaUser, getUserActivity } from "@/lib/hn/algolia";
import { getUser } from "@/lib/hn/firebase";
import type { RawItem } from "@/lib/hn/types";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { readSession } from "@/lib/session";
import { relativeTime } from "@/lib/time";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id} · profile` };
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const loggedIn = !!session?.username;

  const [user, algolia, activity] = await Promise.all([
    getUser(id),
    getAlgoliaUser(id),
    getUserActivity(id, 30).catch(() => null),
  ]);

  if (!user && !algolia) notFound();

  const items: RawItem[] = (activity?.hits ?? [])
    .filter((h) => h._tags?.includes("story"))
    .slice(0, 30)
    .map((h) => ({
      id: Number(h.objectID),
      type: "story",
      by: h.author,
      time: h.created_at_i,
      title: h.title,
      url: h.url,
      score: h.points ?? undefined,
      descendants: h.num_comments ?? 0,
    }));

  const comments = (activity?.hits ?? []).filter((h) => h._tags?.includes("comment")).slice(0, 20);

  return (
    <div className="grid gap-6">
      <HistoryRecorder kind="user" refId={id} title={user?.id ?? algolia?.username ?? id} />
      <header className="rounded-lg border border-border bg-card p-4">
        <h1 className="text-2xl font-semibold">{user?.id ?? algolia?.username ?? id}</h1>
        <div className="mt-1 text-sm text-muted-foreground">
          {typeof user?.karma === "number" ? `${user.karma.toLocaleString()} karma` : null}
          {user?.created ? ` · joined ${relativeTime(user.created)}` : null}
        </div>
        {user?.about ? (
          <div
            className="hn-text mt-3 text-sm"
            dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(user.about) }}
          />
        ) : null}
      </header>

      {items.length > 0 ? (
        <section aria-labelledby="stories">
          <h2 id="stories" className="mb-2 text-sm font-medium text-muted-foreground">
            Recent stories
          </h2>
          <div className="grid gap-2">
            {items.map((it) => (
              <StoryCard key={it.id} item={it} loggedIn={loggedIn} />
            ))}
          </div>
        </section>
      ) : null}

      {comments.length > 0 ? (
        <section aria-labelledby="comments">
          <h2 id="comments" className="mb-2 text-sm font-medium text-muted-foreground">
            Recent comments
          </h2>
          <div className="grid gap-2">
            {comments.map((c) => (
              <article key={c.objectID} className="rounded-md border border-border bg-card p-3">
                <Link
                  href={`/item/${c.story_id ?? c.objectID}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  on: {c.story_title ?? "(thread)"}
                </Link>
                <div
                  className="hn-text mt-1 text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(c.comment_text) }}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.created_at_i ? relativeTime(c.created_at_i) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
