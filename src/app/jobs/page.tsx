import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = {
  title: "Jobs",
  description: "Job listings from Y Combinator–backed startups, posted on Hacker News.",
  alternates: { canonical: "/jobs", types: { "application/rss+xml": "/rss/job" } },
  openGraph: { title: "Hacker News jobs", url: "/jobs" },
};

export default async function JobsPage() {
  const session = await readSession();
  return <StoryList kind="job" loggedIn={!!session?.username} />;
}
