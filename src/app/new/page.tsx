import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = { title: "New stories" };

export default async function NewPage() {
  const session = await readSession();
  return <StoryList kind="new" loggedIn={!!session?.username} />;
}
