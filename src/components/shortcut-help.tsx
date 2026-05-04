"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS: [string, string][] = [
  ["j", "Next story"],
  ["k", "Previous story"],
  ["o", "Open story URL in new tab"],
  ["c", "Open story comments"],
  ["u", "Upvote selected story"],
  ["r", "Reply to selected story"],
  ["?", "Show this help"],
];

export function ShortcutHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Use j/k to navigate the story list.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
          {SHORTCUTS.map(([key, label]) => (
            <div key={key} className="contents">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                {key}
              </kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
