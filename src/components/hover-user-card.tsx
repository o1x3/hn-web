"use client";

import { BookmarkButton } from "@/components/bookmark-button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getPref, setPref } from "@/lib/idb/prefs";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import * as React from "react";

interface ActivityItem {
  id: number;
  title?: string;
  url?: string;
  storyId?: number;
  storyTitle?: string;
  textHtml?: string;
  points?: number;
  createdAt?: number;
}

interface UserCardData {
  username: string;
  karma?: number | null;
  about?: string;
  createdAt?: number | null;
  recent?: { points: number[]; count: number } | null;
  recentStories?: ActivityItem[];
  recentComments?: ActivityItem[];
}

const cache = new Map<string, UserCardData>();

export function HoverUserCard({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const [data, setData] = React.useState<UserCardData | null>(cache.get(username) ?? null);
  const [loading, setLoading] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  async function load() {
    if (data || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user-card/${encodeURIComponent(username)}`);
      if (res.ok) {
        const j = (await res.json()) as UserCardData;
        cache.set(username, j);
        setData(j);
      }
    } finally {
      setLoading(false);
    }
  }

  // Restore pinned position from prefs
  React.useEffect(() => {
    let cancelled = false;
    getPref<{ x: number; y: number }>(`userPopup.pin.${username}`).then((p) => {
      if (!cancelled && p) {
        setPos(p);
        setPinned(true);
        load();
      }
    });
    return () => {
      cancelled = true;
    };
    // load is stable enough for our needs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (pinned && pos) {
    return (
      <>
        {children}
        <PinnedPopover
          username={username}
          data={data}
          pos={pos}
          onMove={(p) => {
            setPos(p);
            setPref(`userPopup.pin.${username}`, p).catch(() => {});
          }}
          onClose={() => {
            setPinned(false);
            setPref(`userPopup.pin.${username}`, null).catch(() => {});
          }}
        />
      </>
    );
  }

  return (
    <HoverCard openDelay={250} closeDelay={150} onOpenChange={(o) => o && load()}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-80"
        onClick={(e) => {
          // Click-pin: any click inside the card (other than a link/button) pins it.
          const t = e.target as HTMLElement;
          if (t.closest("a, button, input, select, textarea")) return;
          const initial = { x: window.innerWidth / 2 - 160, y: 80 };
          setPos(initial);
          setPinned(true);
          setPref(`userPopup.pin.${username}`, initial).catch(() => {});
        }}
      >
        <UserPopupContent data={data} loading={loading} username={username} />
      </HoverCardContent>
    </HoverCard>
  );
}

function PinnedPopover({
  username,
  data,
  pos,
  onMove,
  onClose,
}: {
  username: string;
  data: UserCardData | null;
  pos: { x: number; y: number };
  onMove: (p: { x: number; y: number }) => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest("[data-drag-handle]")) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { ...pos };
    const move = (ev: PointerEvent) => {
      const w = ref.current?.offsetWidth ?? 320;
      const h = ref.current?.offsetHeight ?? 200;
      const maxX = window.innerWidth - w - 8;
      const maxY = window.innerHeight - h - 8;
      onMove({
        x: Math.max(8, Math.min(maxX, start.x + ev.clientX - startX)),
        y: Math.max(8, Math.min(maxY, start.y + ev.clientY - startY)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      style={{ left: pos.x, top: pos.y, position: "fixed" }}
      className="z-50 w-80 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-drag-handle className="cursor-grab" title="Drag">
          ⋮⋮
        </span>
        <button
          type="button"
          onClick={onClose}
          className="hover:text-foreground"
          aria-label="Close pinned popover"
        >
          ×
        </button>
      </div>
      <UserPopupContent data={data} loading={!data} username={username} />
    </div>
  );
}

function UserPopupContent({
  data,
  loading,
  username,
}: {
  data: UserCardData | null;
  loading: boolean;
  username: string;
}) {
  if (loading && !data) {
    return <div className="text-xs text-muted-foreground">Loading…</div>;
  }
  if (!data) {
    return <div className="text-xs text-muted-foreground">No profile</div>;
  }
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Link href={`/user/${data.username}`} className="font-medium hover:underline">
          {data.username}
        </Link>
        <span className="text-xs text-muted-foreground tabular-nums">
          {typeof data.karma === "number" ? `${data.karma.toLocaleString()} karma` : ""}
        </span>
      </div>
      {data.createdAt ? (
        <div className="text-xs text-muted-foreground">Joined {relativeTime(data.createdAt)}</div>
      ) : null}
      {data.recent && data.recent.points.length > 0 ? (
        <Sparkline points={data.recent.points} />
      ) : null}
      {data.about ? (
        <div
          className="hn-text text-xs text-muted-foreground max-h-32 overflow-auto"
          dangerouslySetInnerHTML={{ __html: data.about }}
        />
      ) : null}
      <Tabs.Root defaultValue="stories" className="grid gap-2">
        <Tabs.List className="flex gap-1 border-b border-border">
          <Tabs.Trigger value="stories" className={tabClass}>
            Stories
          </Tabs.Trigger>
          <Tabs.Trigger value="comments" className={tabClass}>
            Comments
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="stories" className="grid gap-1 max-h-40 overflow-auto">
          {(data.recentStories ?? []).length === 0 ? (
            <div className="text-xs text-muted-foreground">No recent stories</div>
          ) : (
            (data.recentStories ?? []).map((s) => (
              <Link
                key={s.id}
                href={`/item/${s.id}`}
                className="block text-xs hover:underline truncate"
                title={s.title}
              >
                {s.title ?? "(untitled)"}
              </Link>
            ))
          )}
        </Tabs.Content>
        <Tabs.Content value="comments" className="grid gap-1 max-h-40 overflow-auto">
          {(data.recentComments ?? []).length === 0 ? (
            <div className="text-xs text-muted-foreground">No recent comments</div>
          ) : (
            (data.recentComments ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/item/${c.id}`}
                className="block rounded border border-border bg-muted/20 px-2 py-1 text-[11px] hover:bg-muted/40"
                title={c.storyTitle}
              >
                <div className="truncate text-muted-foreground">
                  on: {c.storyTitle ?? "(thread)"}
                </div>
                <div
                  className="hn-text mt-0.5 line-clamp-2 text-foreground"
                  dangerouslySetInnerHTML={{ __html: c.textHtml ?? "" }}
                />
              </Link>
            ))
          )}
        </Tabs.Content>
      </Tabs.Root>
      <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
        <BookmarkButton
          kind="user"
          refId={username}
          args={{
            username,
            karma: data.karma ?? undefined,
            createdAt: data.createdAt ?? undefined,
          }}
          showLabel
        />
        <Link href={`/user/${data.username}`} className="text-primary hover:underline">
          Open profile →
        </Link>
      </div>
    </div>
  );
}

const tabClass = cn(
  "px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
  "data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary",
);

/**
 * Sparkline of recent post scores. We log-scale (HN points are heavy-tailed:
 * one viral post would flatten the rest) and apply a 3-tap moving average so
 * trends read clearly even when the underlying series is jittery.
 */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const logged = points.map((v) => Math.log1p(Math.max(0, v)));
  const smoothed = movingAverage(logged, 3);
  const max = Math.max(...smoothed, 1);
  const w = 200;
  const h = 24;
  const stepX = w / (smoothed.length - 1);
  const path = smoothed
    .map((v, i) => {
      const x = i * stepX;
      const y = h - (v / max) * (h - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="text-primary" role="img" aria-labelledby="sparkline-title">
      <title id="sparkline-title">Recent post scores (log-scaled, smoothed)</title>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function movingAverage(xs: number[], window: number): number[] {
  if (window <= 1) return xs;
  const half = Math.floor(window / 2);
  const out: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(xs.length, i + half + 1);
    let sum = 0;
    for (let j = lo; j < hi; j++) sum += xs[j];
    out.push(sum / (hi - lo));
  }
  return out;
}
