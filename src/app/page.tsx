import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;

export const metadata = { title: "Top stories · hn" };

export default async function HomePage() {
  const session = await readSession();
  return <StoryList kind="top" loggedIn={!!session?.username} />;
}
