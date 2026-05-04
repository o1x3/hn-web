import { batchItems, getList } from "@/lib/hn/firebase";
import type { ListKind } from "@/lib/hn/types";
import { type NextRequest, NextResponse } from "next/server";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const kind = (req.nextUrl.searchParams.get("kind") as ListKind) || "top";
  return await respond(kind, req);
}

async function respond(kind: ListKind, req: NextRequest) {
  const ids = await getList(kind);
  const items = await batchItems(ids.slice(0, 30));
  const origin = req.nextUrl.origin;
  const xml = renderRss(kind, items, origin);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}

function renderRss(
  kind: ListKind,
  items: {
    id: number;
    title?: string;
    url?: string;
    by?: string;
    time?: number;
    descendants?: number;
    score?: number;
  }[],
  origin: string,
) {
  const titles: Record<ListKind, string> = {
    top: "Top stories",
    new: "New stories",
    best: "Best stories",
    ask: "Ask HN",
    show: "Show HN",
    job: "Jobs",
  };
  const channelTitle = `hn-reddit · ${titles[kind]}`;
  const feedLink = `${origin}/rss?kind=${kind}`;
  const channelDesc = `Latest from Hacker News (${kind})`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xmlEscape(channelTitle)}</title>
<link>${origin}</link>
<atom:link href="${feedLink}" rel="self" type="application/rss+xml" />
<description>${xmlEscape(channelDesc)}</description>
${items
  .map(
    (it) => `<item>
<title>${xmlEscape(it.title ?? "(no title)")}</title>
<link>${xmlEscape(it.url ?? `${origin}/item/${it.id}`)}</link>
<guid isPermaLink="false">hn-${it.id}</guid>
<pubDate>${it.time ? new Date(it.time * 1000).toUTCString() : ""}</pubDate>
<comments>${origin}/item/${it.id}</comments>
<description>${xmlEscape(`${it.score ?? 0} points · ${it.descendants ?? 0} comments · by ${it.by ?? ""}`)}</description>
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
