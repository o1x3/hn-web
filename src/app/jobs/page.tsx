import { StoryList } from "@/components/story-list";
import { readSession } from "@/lib/session";

export const revalidate = 60;
export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  const session = await readSession();
  return <StoryList kind="job" loggedIn={!!session?.username} />;
}
