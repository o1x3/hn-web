import { getList } from "@/lib/hn/firebase";
import type { ListKind } from "@/lib/hn/types";
import { type NextRequest, NextResponse } from "next/server";

const VALID: ListKind[] = ["top", "new", "best", "ask", "show", "job"];
const HEAD_LIMIT = 60;

/**
 * Lightweight endpoint for the list-updates pill. Returns the first 60 ids
 * for a given list kind so the pill can compute "N new since first paint"
 * without fetching the full item bodies.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") as ListKind | null;
  if (!kind || !VALID.includes(kind)) {
    return NextResponse.json({ error: "bad kind" }, { status: 400 });
  }
  const ids = await getList(kind);
  return NextResponse.json(
    { ids: ids.slice(0, HEAD_LIMIT) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
