import { InboxList } from "@/components/inbox-list";
import { readSession } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Replies to your comments since you last checked.",
};

export default async function InboxPage() {
  const session = await readSession();
  const username = session?.username;

  if (!username) {
    return (
      <div className="rounded-md border border-border p-6 text-sm">
        <p className="font-medium">Log in to see your replies</p>
        <p className="mt-1 text-muted-foreground">
          Your reply inbox shows comments others have made on your threads since the last time you
          checked.
        </p>
        <Link
          href="/settings"
          className="mt-3 inline-block rounded border border-border px-3 py-1 text-sm hover:bg-accent"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return <InboxList username={username} />;
}
