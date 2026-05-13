import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = {
  title: "Show HN",
  description: "Show HN — projects, products, and demos shared by the Hacker News community.",
  alternates: { canonical: "/show", types: { "application/rss+xml": "/rss/show" } },
  openGraph: { title: "Show HN", url: "/show" },
};

export default async function ShowPage() {
  const session = await readSession();
  return <StoryList kind="show" loggedIn={!!session?.username} />;
}
