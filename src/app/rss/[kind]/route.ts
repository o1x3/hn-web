import { batchItems, getList } from "@/lib/hn/firebase";
import type { ListKind } from "@/lib/hn/types";
import { type NextRequest, NextResponse } from "next/server";

const VALID: ListKind[] = ["top", "new", "best", "ask", "show", "job"];

export const revalidate = 300;

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!VALID.includes(kind as ListKind)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const ids = await getList(kind as ListKind);
  const items = await batchItems(ids.slice(0, 30));
  const origin = req.nextUrl.origin;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>hn · ${kind}</title>
<link>${origin}/${kind}</link>
<description>Latest ${kind} stories</description>
${items
  .map(
    (it) => `<item>
<title>${xmlEscape(it.title ?? "(no title)")}</title>
<link>${xmlEscape(it.url ?? `${origin}/item/${it.id}`)}</link>
<guid isPermaLink="false">hn-${it.id}</guid>
<pubDate>${it.time ? new Date(it.time * 1000).toUTCString() : ""}</pubDate>
<comments>${origin}/item/${it.id}</comments>
</item>`,
  )
  .join("\n")}
</channel></rss>`;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
