import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = { title: "Ask HN" };

export default async function AskPage() {
  const session = await readSession();
  return <StoryList kind="ask" loggedIn={!!session?.username} />;
}
