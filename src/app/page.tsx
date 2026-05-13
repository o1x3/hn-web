import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;

export const metadata = {
  title: "Top stories",
  description:
    "The current top stories on Hacker News — links shared and discussed by the HN community.",
  alternates: { canonical: "/", types: { "application/rss+xml": "/rss/top" } },
  openGraph: {
    title: "Top stories on Hacker News",
    description:
      "The current top stories on Hacker News — links shared and discussed by the HN community.",
    url: "/",
  },
};

export default async function HomePage() {
  const session = await readSession();
  return <StoryList kind="top" loggedIn={!!session?.username} />;
}
