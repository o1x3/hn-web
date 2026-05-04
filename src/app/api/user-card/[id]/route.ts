import { getAlgoliaUser, getUserActivity } from "@/lib/hn/algolia";
import { getUser } from "@/lib/hn/firebase";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({}, { status: 400 });

  const [u, algolia, activity] = await Promise.all([
    getUser(id),
    getAlgoliaUser(id),
    getUserActivity(id, 50).catch(() => null),
  ]);

  if (!u && !algolia) return NextResponse.json({}, { status: 404 });

  const points = (activity?.hits ?? [])
    .map((h) => h.points ?? 0)
    .filter((n) => Number.isFinite(n))
    .slice(-50);

  return NextResponse.json({
    username: u?.id ?? algolia?.username ?? id,
    karma: u?.karma ?? algolia?.karma ?? null,
    about: sanitizeHnHtml(u?.about),
    createdAt: u?.created ?? algolia?.created_at_i ?? null,
    recent: points.length ? { points, count: activity?.nbHits ?? points.length } : null,
  });
}

export const revalidate = 300;
