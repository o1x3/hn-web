import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = { title: "Best stories" };

export default async function BestPage() {
  const session = await readSession();
  return <StoryList kind="best" loggedIn={!!session?.username} />;
}
