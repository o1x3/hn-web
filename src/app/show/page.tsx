import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = { title: "Show HN" };

export default async function ShowPage() {
  const session = await readSession();
  return <StoryList kind="show" loggedIn={!!session?.username} />;
}
