import { getRepliesForUser } from "@/lib/replies/inbox";
import { readSession } from "@/lib/session";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await readSession();
  const username = session?.username;
  if (!username) {
    return NextResponse.json({ replies: [], error: "unauthenticated" }, { status: 200 });
  }

  const sinceParam = req.nextUrl.searchParams.get("since");
  const since = sinceParam ? Number(sinceParam) : 0;
  if (!Number.isFinite(since) || since < 0) {
    return NextResponse.json({ replies: [], error: "bad-since" }, { status: 400 });
  }

  try {
    const replies = await getRepliesForUser(username, since);
    return NextResponse.json({ replies }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch {
    return NextResponse.json({ replies: [], error: "upstream" }, { status: 200 });
  }
}
