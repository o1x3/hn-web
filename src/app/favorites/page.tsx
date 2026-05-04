import { PersonalizedListPage } from "@/components/personalized-list-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Favorites" };
export default function Page() {
  return <PersonalizedListPage path="/favorites" title="Favorites" requiresUser />;
}
