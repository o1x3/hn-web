import { HistoryView } from "@/components/history-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <div className="grid gap-4 max-w-2xl">
      <header>
        <h1 className="text-lg font-semibold">History</h1>
        <p className="text-xs text-muted-foreground">
          Every story and user you've opened, kept locally. Unlimited — no 30-item cap.
        </p>
      </header>
      <HistoryView />
    </div>
  );
}
