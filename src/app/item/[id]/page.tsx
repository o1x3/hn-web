import { BookmarkButton } from "@/components/bookmark-button";
import { DomainFavicon } from "@/components/domain-favicon";
import { FavoriteButton } from "@/components/favorite-button";
import { HistoryRecorder } from "@/components/history-recorder";
import { HoverUserCard } from "@/components/hover-user-card";
import { ItemCommentSection } from "@/components/item-comment-section";
import { ReplyForm } from "@/components/reply-form";
import { VoteButton } from "@/components/vote-button";
import { getItemTree } from "@/lib/hn/algolia";
import { fanoutCommentTree, getItem } from "@/lib/hn/firebase";
import type { AlgoliaTreeNode, CommentNode, RawItem } from "@/lib/hn/types";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { readSession } from "@/lib/session";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { relativeTime } from "@/lib/time";
import { hostFromUrl } from "@/lib/utils";
import { ChevronUp, ExternalLink, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 120;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(Number(id));
  const title = item?.title ?? `Item ${id}`;
  const host = hostFromUrl(item?.url);
  const description = item?.text
    ? stripTags(item.text).slice(0, 200)
    : item?.url
      ? `Discussion on Hacker News${host ? ` (${host})` : ""} — ${item.descendants ?? 0} comments, ${item.score ?? 0} points.`
      : `Hacker News discussion thread #${id}.`;
  const canonical = `/item/${id}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      ...(item?.time ? { publishedTime: new Date(item.time * 1000).toISOString() } : {}),
      ...(item?.by ? { authors: [item.by] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: item?.dead || item?.deleted ? { index: false, follow: false } : undefined,
  };
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) notFound();

  const session = await readSession();
  const loggedIn = !!session?.username;

  const item = await getItem(itemId);
  if (!item || item.deleted) notFound();

  // FRAGILE: Algolia 404s on freshly-posted items. Fall back to Firebase.
  const tree = await getItemTree(itemId);
  let fallback: CommentNode[] = [];
  if (!tree && item.kids?.length) {
    const flat = await fanoutCommentTree(itemId, 6);
    fallback = assembleTreeFromFlat(itemId, flat);
  }

  const comments: CommentNode[] = tree ? algoliaToComments(tree.children ?? []) : fallback;

  const host = hostFromUrl(item.url);
  const jsonLd = buildItemJsonLd(item, comments);

  return (
    <article className="grid gap-6">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized object
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HistoryRecorder kind="story" refId={String(item.id)} title={item.title ?? undefined} />
      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
            <VoteButton itemId={item.id} initialScore={item.score ?? null} loggedIn={loggedIn} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-snug">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {item.title}
                  <ExternalLink className="inline ml-1 size-3 align-text-top" />
                </a>
              ) : (
                <>{item.title}</>
              )}
              {host ? (
                <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-muted-foreground">
                  <DomainFavicon domain={host} />
                  {host}
                </span>
              ) : null}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ChevronUp className="size-3" />
                {item.score ?? 0} points
              </span>
              {item.by ? (
                <HoverUserCard username={item.by}>
                  <Link href={`/user/${item.by}`} className="hover:text-foreground">
                    {item.by}
                  </Link>
                </HoverUserCard>
              ) : null}
              {item.time ? <span>{relativeTime(item.time)}</span> : null}
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3" />
                {item.descendants ?? 0} comments
              </span>
              <FavoriteButton itemId={item.id} loggedIn={loggedIn} />
              <BookmarkButton
                kind="story"
                refId={String(item.id)}
                args={{
                  storyId: item.id,
                  title: item.title,
                  url: item.url,
                  by: item.by,
                  time: item.time,
                  score: item.score,
                  descendants: item.descendants,
                }}
              />
            </div>
            {item.text ? (
              <div
                data-hn-text
                className="hn-text mt-3 text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(item.text) }}
              />
            ) : null}
          </div>
        </div>
      </header>

      <section aria-label="Reply">
        <h2 className="sr-only">Add a comment</h2>
        <ReplyForm parentId={item.id} loggedIn={loggedIn} compact={false} />
      </section>

      <section aria-label="Comments" className="grid gap-1">
        <h2 className="sr-only">Comments</h2>
        <ItemCommentSection
          storyId={item.id}
          comments={comments}
          loggedIn={loggedIn}
          showDead={false}
        />
      </section>
    </article>
  );
}

function algoliaToComments(nodes: AlgoliaTreeNode[]): CommentNode[] {
  return nodes
    .filter((n) => n.type === "comment" || n.children?.length)
    .map((n) => ({
      id: n.id,
      author: n.author ?? null,
      textHtml: sanitizeHnHtml(n.text ?? n.comment_text ?? ""),
      createdAt: n.created_at_i ?? 0,
      dead: false,
      deleted: !n.author && !n.text && !n.comment_text,
      children: algoliaToComments(n.children ?? []),
    }));
}

function assembleTreeFromFlat(rootId: number, flat: RawItem[]): CommentNode[] {
  const byId = new Map<number, RawItem>();
  for (const it of flat) byId.set(it.id, it);
  function build(id: number): CommentNode | null {
    const it = byId.get(id);
    if (!it) return null;
    return {
      id: it.id,
      author: it.by ?? null,
      textHtml: sanitizeHnHtml(it.text ?? ""),
      createdAt: it.time ?? 0,
      dead: !!it.dead,
      deleted: !!it.deleted,
      children: (it.kids ?? []).map(build).filter((c): c is CommentNode => !!c),
    };
  }
  const root = byId.get(rootId);
  return (root?.kids ?? []).map(build).filter((c): c is CommentNode => !!c);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function buildItemJsonLd(item: RawItem, comments: CommentNode[]) {
  const url = `${SITE_URL}/item/${item.id}`;
  const headline = item.title ?? `Item ${item.id}`;
  const datePublished = item.time ? new Date(item.time * 1000).toISOString() : undefined;
  const author = item.by
    ? { "@type": "Person" as const, name: item.by, url: `${SITE_URL}/user/${item.by}` }
    : undefined;
  const articleBody = item.text ? stripTags(item.text) : undefined;

  const renderComment = (c: CommentNode): Record<string, unknown> | null => {
    if (c.deleted || c.dead) return null;
    const text = c.textHtml.replace(/<[^>]*>/g, "");
    return {
      "@type": "Comment",
      text,
      url: `${SITE_URL}/item/${c.id}`,
      ...(c.createdAt ? { dateCreated: new Date(c.createdAt * 1000).toISOString() } : {}),
      ...(c.author
        ? { author: { "@type": "Person", name: c.author, url: `${SITE_URL}/user/${c.author}` } }
        : {}),
    };
  };
  const topComments = comments.map(renderComment).filter(Boolean).slice(0, 25);

  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": url,
    url,
    mainEntityOfPage: url,
    headline,
    name: headline,
    ...(articleBody ? { articleBody, text: articleBody } : {}),
    ...(item.url ? { discussionUrl: item.url } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(author ? { author } : {}),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: item.descendants ?? 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: item.score ?? 0,
      },
    ],
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(topComments.length ? { comment: topComments, commentCount: item.descendants ?? 0 } : {}),
  };
}
