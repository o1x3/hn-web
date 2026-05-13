import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = {
  title: "New stories",
  description: "The newest submissions to Hacker News, updated continuously.",
  alternates: { canonical: "/new", types: { "application/rss+xml": "/rss/new" } },
  openGraph: { title: "New stories on Hacker News", url: "/new" },
};

export default async function NewPage() {
  const session = await readSession();
  return <StoryList kind="new" loggedIn={!!session?.username} />;
}
