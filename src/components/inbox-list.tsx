"use client";

import { Button } from "@/components/ui/button";
import type { ReplyItem } from "@/lib/replies/inbox";
import {
  dismissReply,
  markInboxChecked,
  useDismissedReplyIds,
  useInboxLastCheckedAt,
} from "@/lib/replies/inbox-store";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { relativeTime } from "@/lib/time";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";

interface InboxResponse {
  replies: ReplyItem[];
  error?: string;
}

export function InboxList({ username }: { username: string }) {
  const since = useInboxLastCheckedAt(username);
  const dismissed = useDismissedReplyIds(username);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useQuery<InboxResponse>({
    queryKey: ["inbox", username, since],
    enabled: since != null,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/inbox?since=${since ?? 0}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as InboxResponse;
    },
  });

  const replies = (data?.replies ?? []).filter((r) => !dismissed.includes(r.id));

  const onMarkRead = async () => {
    await markInboxChecked(username);
    qc.invalidateQueries({ queryKey: ["inbox", username] });
    qc.invalidateQueries({ queryKey: ["inbox-count", username] });
  };

  if (since == null || isLoading) {
    return <div className="text-sm text-muted-foreground">Loading replies…</div>;
  }

  if (data?.error === "upstream") {
    return (
      <div className="rounded-md border border-border p-4 text-sm">
        <p className="text-muted-foreground">Couldn't reach Algolia. Try again.</p>
        <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        Couldn't load replies.{" "}
        <button type="button" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <span className="text-sm text-muted-foreground">
          {replies.length} {replies.length === 1 ? "reply" : "replies"} since{" "}
          {since ? new Date(since).toLocaleString() : "—"}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={onMarkRead}
          disabled={isFetching}
        >
          Mark all read
        </Button>
      </div>

      {replies.length === 0 ? (
        <div className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
          No new replies. ✨
        </div>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => (
            <ReplyRow
              key={r.id}
              reply={r}
              onDismiss={async () => {
                await dismissReply(username, r.id);
                qc.invalidateQueries({ queryKey: ["inbox", username] });
                qc.invalidateQueries({ queryKey: ["inbox-count", username] });
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReplyRow({ reply, onDismiss }: { reply: ReplyItem; onDismiss: () => void }) {
  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`/user/${reply.author}`}
          className="font-medium text-foreground hover:underline"
        >
          {reply.author}
        </Link>
        <span aria-hidden>·</span>
        <span title={new Date(reply.createdAt * 1000).toISOString()}>
          {relativeTime(reply.createdAt)}
        </span>
        <span aria-hidden>·</span>
        <Link
          href={`/item/${reply.storyId}`}
          className="hover:text-foreground"
          title={reply.storyTitle}
        >
          {reply.storyTitle || "story"}
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto rounded px-1 text-muted-foreground hover:bg-accent"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ×
        </button>
      </div>
      {reply.parentTextSnippet ? (
        <blockquote className="mt-2 border-l-2 border-border pl-2 text-xs text-muted-foreground">
          {reply.parentTextSnippet}
        </blockquote>
      ) : null}
      <div
        className="hn-text mt-2 text-sm"
        dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(reply.textHtml) }}
      />
      <div className="mt-2 text-xs">
        <Link href={`/item/${reply.storyId}#${reply.id}`} className="text-primary hover:underline">
          Open in thread →
        </Link>
      </div>
    </li>
  );
}
