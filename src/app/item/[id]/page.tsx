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
  return {
    title: item?.title ?? `Item ${id}`,
    openGraph: {
      title: item?.title ?? `Item ${id}`,
      description: item?.text ? stripTags(item.text).slice(0, 200) : undefined,
      type: "article",
    },
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

  return (
    <article className="grid gap-6">
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
