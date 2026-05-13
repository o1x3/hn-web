import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = {
  title: "Best stories",
  description: "The best stories on Hacker News — highest-rated links from the community.",
  alternates: { canonical: "/best", types: { "application/rss+xml": "/rss/best" } },
  openGraph: { title: "Best stories on Hacker News", url: "/best" },
};

export default async function BestPage() {
  const session = await readSession();
  return <StoryList kind="best" loggedIn={!!session?.username} />;
}
