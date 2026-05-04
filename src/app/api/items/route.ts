import { batchItems } from "@/lib/hn/firebase";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) return NextResponse.json([]);
  const ids = idsParam
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n))
    .slice(0, 50);
  const items = await batchItems(ids);
  return NextResponse.json(items);
}
