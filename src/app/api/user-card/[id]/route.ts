import { getAlgoliaUser, getUserActivity } from "@/lib/hn/algolia";
import { getUser } from "@/lib/hn/firebase";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { type NextRequest, NextResponse } from "next/server";

export interface UserCardActivityItem {
  id: number;
  title?: string;
  url?: string;
  storyId?: number;
  storyTitle?: string;
  textHtml?: string;
  points?: number;
  createdAt?: number;
}

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

  const recentStories: UserCardActivityItem[] = (activity?.hits ?? [])
    .filter((h) => h._tags?.includes("story"))
    .slice(0, 10)
    .map((h) => ({
      id: Number(h.objectID),
      title: h.title,
      url: h.url,
      points: h.points ?? 0,
      createdAt: h.created_at_i,
    }));

  const recentComments: UserCardActivityItem[] = (activity?.hits ?? [])
    .filter((h) => h._tags?.includes("comment"))
    .slice(0, 10)
    .map((h) => ({
      id: Number(h.objectID),
      storyId: h.story_id,
      storyTitle: h.story_title,
      textHtml: sanitizeHnHtml(h.comment_text),
      createdAt: h.created_at_i,
    }));

  return NextResponse.json({
    username: u?.id ?? algolia?.username ?? id,
    karma: u?.karma ?? algolia?.karma ?? null,
    about: sanitizeHnHtml(u?.about),
    createdAt: u?.created ?? algolia?.created_at_i ?? null,
    recent: points.length ? { points, count: activity?.nbHits ?? points.length } : null,
    recentStories,
    recentComments,
  });
}

export const revalidate = 300;
