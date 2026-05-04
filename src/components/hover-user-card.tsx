"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { relativeTime } from "@/lib/time";
import * as React from "react";

interface UserCardData {
  username: string;
  karma?: number;
  about?: string;
  createdAt?: number;
  recent?: { points: number[]; count: number };
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

  return (
    <HoverCard openDelay={250} closeDelay={150} onOpenChange={(o) => o && load()}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent>
        {!data && loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : !data ? (
          <div className="text-xs text-muted-foreground">No profile</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{data.username}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {typeof data.karma === "number" ? `${data.karma.toLocaleString()} karma` : ""}
              </span>
            </div>
            {data.createdAt ? (
              <div className="text-xs text-muted-foreground">
                Joined {relativeTime(data.createdAt)}
              </div>
            ) : null}
            {data.recent && data.recent.points.length > 0 ? (
              <Sparkline points={data.recent.points} />
            ) : null}
            {data.about ? (
              <div
                className="hn-text text-xs text-muted-foreground line-clamp-3"
                // Already sanitized server-side.
                dangerouslySetInnerHTML={{ __html: data.about }}
              />
            ) : null}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const w = 200;
  const h = 24;
  const stepX = w / (points.length - 1);
  const path = points
    .map((v, i) => {
      const x = i * stepX;
      const y = h - (v / max) * (h - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="text-primary" role="img" aria-labelledby="sparkline-title">
      <title id="sparkline-title">Recent post scores</title>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
