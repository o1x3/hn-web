import { BookmarkList } from "@/components/bookmark-list";
import type { BookmarkKind } from "@/lib/idb/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookmarks" };

const VALID: BookmarkKind[] = ["story", "comment", "highlight", "user"];

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const requested = sp.type as BookmarkKind | undefined;
  const initialKind = requested && VALID.includes(requested) ? requested : "story";
  return (
    <div className="grid gap-4 max-w-2xl">
      <header>
        <h1 className="text-lg font-semibold">Bookmarks</h1>
        <p className="text-xs text-muted-foreground">
          All saved locally in your browser. No accounts, no caps, no telemetry.
        </p>
      </header>
      <BookmarkList initialKind={initialKind} />
    </div>
  );
}
