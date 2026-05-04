"use client";

import { Button } from "@/components/ui/button";
import { removeBookmark, updateBookmark, useBookmarks } from "@/lib/bookmarks/store";
import { setHighlightColor } from "@/lib/highlight/store";
import type { BookmarkKind, BookmarkRecord, HighlightColor } from "@/lib/idb/schema";
import { cn } from "@/lib/utils";
import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const KINDS: { id: BookmarkKind; label: string }[] = [
  { id: "story", label: "Stories" },
  { id: "comment", label: "Comments" },
  { id: "highlight", label: "Highlights" },
  { id: "user", label: "Users" },
];

const SORTS = [
  { id: "added", label: "Date added" },
  { id: "date", label: "Item date" },
  { id: "author", label: "Author" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const COLORS: HighlightColor[] = ["yellow", "orange", "pink"];

export function BookmarkList({ initialKind = "story" }: { initialKind?: BookmarkKind }) {
  const [kind, setKind] = React.useState<BookmarkKind>(initialKind);
  const [q, setQ] = React.useState("");
  const [tag, setTag] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<SortId>("added");
  const { data, isLoading } = useBookmarks();

  const all = data ?? [];
  const allTags = React.useMemo(() => {
    const s = new Set<string>();
    for (const b of all) for (const t of b.tags ?? []) s.add(t);
    return Array.from(s).sort();
  }, [all]);

  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = all.filter((b) => b.kind === kind);
    if (tag) list = list.filter((b) => b.tags?.includes(tag));
    if (ql) {
      list = list.filter((b) => {
        const blob = JSON.stringify(b.payload).toLowerCase();
        return (
          blob.includes(ql) ||
          (b.note ?? "").toLowerCase().includes(ql) ||
          (b.tags ?? []).some((t) => t.toLowerCase().includes(ql))
        );
      });
    }
    return list.sort(sortFn(sort));
  }, [all, kind, q, tag, sort]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              kind === k.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {k.label}
            <span className="ml-1 text-[10px] opacity-70">
              {all.filter((b) => b.kind === k.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="flex-1 min-w-[10rem] rounded-md border border-border bg-card px-3 py-1.5 text-sm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
          className="rounded-md border border-border bg-card px-2 py-1.5 text-sm"
          aria-label="Sort"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px]",
              tag === null
                ? "bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            all tags
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px]",
                tag === t
                  ? "bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              #{t}
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No bookmarks here yet. Save items with the bookmark icon.
        </div>
      ) : (
        <ul className="grid gap-2">
          {filtered.map((b) => (
            <BookmarkRow key={b.id} bookmark={b} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BookmarkRow({ bookmark }: { bookmark: BookmarkRecord }) {
  const [note, setNote] = React.useState(bookmark.note ?? "");
  const noteRef = React.useRef(note);
  noteRef.current = note;

  const saveNote = React.useCallback(async () => {
    if (noteRef.current === (bookmark.note ?? "")) return;
    await updateBookmark(bookmark.id, { note: noteRef.current });
  }, [bookmark.id, bookmark.note]);

  return (
    <li className="rounded-md border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <BookmarkPayload bookmark={bookmark} />
          {bookmark.kind === "highlight" ? (
            <div className="mt-2 flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={async () => {
                    const hid = (bookmark.payload as { highlightId?: string }).highlightId;
                    if (hid) await setHighlightColor(hid, c);
                    await updateBookmark(bookmark.id, {
                      payload: { ...bookmark.payload, color: c },
                    });
                  }}
                  className={cn(
                    "size-4 rounded-full border",
                    c === "yellow" && "bg-yellow-300/70",
                    c === "orange" && "bg-orange-400/70",
                    c === "pink" && "bg-pink-400/70",
                    (bookmark.payload as { color?: string }).color === c && "ring-2 ring-ring",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeBookmark(bookmark.id)}
          aria-label="Remove bookmark"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={saveNote}
        placeholder="Add a note…"
        className="mt-2 w-full rounded border border-dashed border-border bg-transparent px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
    </li>
  );
}

function BookmarkPayload({ bookmark }: { bookmark: BookmarkRecord }) {
  const p = bookmark.payload as Record<string, unknown>;
  if (bookmark.kind === "story") {
    return (
      <div className="space-y-1">
        <div className="font-medium">
          <Link href={`/item/${p.storyId}`} className="hover:underline">
            {String(p.title ?? "(untitled)")}
          </Link>
          {p.url ? (
            <a
              href={String(p.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="inline size-3" />
            </a>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground">
          {p.by ? (
            <Link href={`/user/${p.by}`} className="hover:underline">
              {String(p.by)}
            </Link>
          ) : null}
          {p.score ? <> · {String(p.score)} pts</> : null}
        </div>
      </div>
    );
  }
  if (bookmark.kind === "comment") {
    return (
      <div className="space-y-1">
        <Link
          href={String(p.permalink ?? `/item/${p.commentId}`)}
          className="text-sm hover:underline"
        >
          {p.author ? <span className="font-medium">{String(p.author)}</span> : <em>[deleted]</em>}
        </Link>
        <div className="text-xs text-muted-foreground line-clamp-3">{String(p.snippet ?? "")}</div>
      </div>
    );
  }
  if (bookmark.kind === "user") {
    return (
      <div>
        <Link href={`/user/${p.username}`} className="font-medium hover:underline">
          {String(p.username)}
        </Link>
        {p.karma ? (
          <span className="ml-2 text-xs text-muted-foreground">{String(p.karma)} karma</span>
        ) : null}
      </div>
    );
  }
  if (bookmark.kind === "highlight") {
    return (
      <div className="space-y-1">
        <Link
          href={p.commentId ? `/item/${p.commentId}` : `/item/${p.storyId}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          {p.commentId ? `comment ${String(p.commentId)}` : `story ${String(p.storyId)}`}
        </Link>
        <blockquote
          className={cn(
            "rounded px-2 py-1 text-sm",
            (p.color === "orange" && "bg-orange-400/30") ||
              (p.color === "pink" && "bg-pink-400/30") ||
              "bg-yellow-300/30",
          )}
        >
          {String(p.text ?? "")}
        </blockquote>
      </div>
    );
  }
  return null;
}

function sortFn(s: SortId): (a: BookmarkRecord, b: BookmarkRecord) => number {
  if (s === "added") return (a, b) => b.createdAt - a.createdAt;
  if (s === "date")
    return (a, b) =>
      Number((b.payload as { time?: number }).time ?? 0) -
      Number((a.payload as { time?: number }).time ?? 0);
  return (a, b) => {
    const an = String(
      (a.payload as { by?: string; author?: string; username?: string }).by ??
        (a.payload as { author?: string }).author ??
        (a.payload as { username?: string }).username ??
        "",
    );
    const bn = String(
      (b.payload as { by?: string; author?: string; username?: string }).by ??
        (b.payload as { author?: string }).author ??
        (b.payload as { username?: string }).username ??
        "",
    );
    return an.localeCompare(bn);
  };
}
