import { PersonalizedListPage } from "@/components/personalized-list-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Upvoted" };
export default function Page() {
  return <PersonalizedListPage path="/upvoted" title="Upvoted" requiresUser />;
}
