import { HistoryRecorder } from "@/components/history-recorder";
import { ProfileAvatar } from "@/components/profile-avatar";
import { type ProfileTab, ProfileTabs } from "@/components/profile-tabs";
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

const VALID_TABS: ProfileTab[] = ["overview", "stories", "comments", "about"];

export async function generateMetadata({
  params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id} · profile` };
}

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: ProfileTab = VALID_TABS.includes(tabParam as ProfileTab)
    ? (tabParam as ProfileTab)
    : "overview";

  const session = await readSession();
  const loggedIn = !!session?.username;

  const [user, algolia, activity] = await Promise.all([
    getUser(id),
    getAlgoliaUser(id),
    getUserActivity(id, 50).catch(() => null),
  ]);

  if (!user && !algolia) notFound();

  const stories: RawItem[] = (activity?.hits ?? [])
    .filter((h) => h._tags?.includes("story"))
    .slice(0, 50)
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

  const comments = (activity?.hits ?? []).filter((h) => h._tags?.includes("comment")).slice(0, 50);
  const displayName = user?.id ?? algolia?.username ?? id;
  const aboutHtml = user?.about ?? "";
  const karma = typeof user?.karma === "number" ? user.karma : null;
  const created = user?.created;

  return (
    <div className="grid gap-4">
      <HistoryRecorder kind="user" refId={id} title={displayName} />

      <header className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">
        <ProfileAvatar username={displayName} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-tight">{displayName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {karma != null ? <span>{karma.toLocaleString()} karma</span> : null}
            {created ? <span>· joined {relativeTime(created)}</span> : null}
            <span aria-hidden>·</span>
            <a
              href={`https://news.ycombinator.com/user?id=${displayName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground hover:underline"
            >
              View on HN
            </a>
          </div>
        </div>
      </header>

      <ProfileTabs username={displayName} current={tab} />

      {tab === "overview" ? (
        <div className="grid gap-6">
          {aboutHtml ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">About</h2>
              <div
                className="hn-text text-sm"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized
                dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(aboutHtml) }}
              />
            </section>
          ) : null}
          {stories.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">Recent stories</h2>
              <div className="grid gap-2">
                {stories.slice(0, 5).map((it) => (
                  <StoryCard key={it.id} item={it} loggedIn={loggedIn} />
                ))}
              </div>
              {stories.length > 5 ? (
                <Link
                  href={`/user/${displayName}?tab=stories`}
                  className="mt-2 inline-block text-xs text-muted-foreground hover:text-foreground"
                >
                  See all {stories.length} →
                </Link>
              ) : null}
            </section>
          ) : null}
          {comments.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">Recent comments</h2>
              <CommentList comments={comments.slice(0, 5)} />
              {comments.length > 5 ? (
                <Link
                  href={`/user/${displayName}?tab=comments`}
                  className="mt-2 inline-block text-xs text-muted-foreground hover:text-foreground"
                >
                  See all {comments.length} →
                </Link>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "stories" ? (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Stories ({stories.length})
          </h2>
          <div className="grid gap-2">
            {stories.length === 0 ? (
              <EmptyState text={`${displayName} hasn't submitted any stories yet.`} />
            ) : (
              stories.map((it) => <StoryCard key={it.id} item={it} loggedIn={loggedIn} />)
            )}
          </div>
        </section>
      ) : null}

      {tab === "comments" ? (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Comments ({comments.length})
          </h2>
          {comments.length === 0 ? (
            <EmptyState text={`${displayName} hasn't commented recently.`} />
          ) : (
            <CommentList comments={comments} />
          )}
        </section>
      ) : null}

      {tab === "about" ? (
        <section className="rounded-lg border border-border bg-card p-5">
          {aboutHtml ? (
            <div
              className="hn-text text-sm"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized
              dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(aboutHtml) }}
            />
          ) : (
            <EmptyState text={`${displayName} hasn't written a bio.`} />
          )}
        </section>
      ) : null}
    </div>
  );
}

function CommentList({
  comments,
}: {
  comments: {
    objectID: string;
    story_id?: number;
    story_title?: string;
    comment_text?: string;
    created_at_i?: number;
  }[];
}) {
  return (
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
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized
            dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(c.comment_text) }}
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {c.created_at_i ? relativeTime(c.created_at_i) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
