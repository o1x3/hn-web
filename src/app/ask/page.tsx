import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = {
  title: "Ask HN",
  description: "Ask HN — questions and discussions posted by the Hacker News community.",
  alternates: { canonical: "/ask", types: { "application/rss+xml": "/rss/ask" } },
  openGraph: { title: "Ask HN", url: "/ask" },
};

export default async function AskPage() {
  const session = await readSession();
  return <StoryList kind="ask" loggedIn={!!session?.username} />;
}
