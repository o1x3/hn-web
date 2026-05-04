import { PersonalizedListPage } from "@/components/personalized-list-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Submitted" };
export default function Page() {
  return <PersonalizedListPage path="/submitted" title="Submitted" requiresUser />;
}
