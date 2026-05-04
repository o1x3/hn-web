import { PersonalizedListPage } from "@/components/personalized-list-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Threads" };
export default function Page() {
  return <PersonalizedListPage path="/threads" title="Your threads" requiresUser />;
}
