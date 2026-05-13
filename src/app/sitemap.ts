import { getList } from "@/lib/hn/firebase";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFreq: "hourly", priority: 1.0 },
  { path: "/new", changeFreq: "hourly", priority: 0.9 },
  { path: "/best", changeFreq: "hourly", priority: 0.9 },
  { path: "/ask", changeFreq: "hourly", priority: 0.8 },
  { path: "/show", changeFreq: "hourly", priority: 0.8 },
  { path: "/jobs", changeFreq: "daily", priority: 0.6 },
  { path: "/front", changeFreq: "daily", priority: 0.7 },
  { path: "/search", changeFreq: "weekly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  // Top 200 stories — surfaces fresh, indexable content for crawlers.
  let topIds: number[] = [];
  try {
    topIds = (await getList("top")).slice(0, 200);
  } catch {
    topIds = [];
  }
  const items: MetadataRoute.Sitemap = topIds.map((id) => ({
    url: `${SITE_URL}/item/${id}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  return [...base, ...items];
}
