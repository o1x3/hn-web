import { SubmitForm } from "@/components/submit-form";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit" };

export default async function SubmitPage() {
  const session = await readSession();
  if (!session?.username) {
    // Show a "sign in to submit" rather than redirecting away.
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Submit a story</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to submit. Use the “Sign in” button in the header.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 max-w-2xl">
      <h1 className="text-lg font-semibold">Submit a story</h1>
      <p className="text-sm text-muted-foreground">
        Either link to a URL or write a text post. New accounts may be subject to invisible
        rate-limits on HN; if your post doesn’t appear, try again later.
      </p>
      <SubmitForm />
    </div>
  );
}
