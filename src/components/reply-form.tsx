"use client";

import { CommentEditor } from "@/components/comment-editor";
import { LoginDialog } from "@/components/login-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { replyAction } from "@/lib/hn/actions";
import { useRouter } from "next/navigation";
import * as React from "react";

export function ReplyForm({
  parentId,
  loggedIn,
  compact = false,
}: {
  parentId: number;
  loggedIn: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = React.useState(!compact);
  const [busy, setBusy] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [prefill, setPrefill] = React.useState<string>("");
  const toast = useToast();
  const router = useRouter();

  // F5: listen for "reply quoting" events from the SelectionPopup. We accept
  // events whose `detail.commentId` matches this parentId so multiple ReplyForms
  // on the page don't all open at once.
  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ commentId: number | null; text: string }>;
      if (!ce.detail) return;
      if (ce.detail.commentId != null && ce.detail.commentId !== parentId) return;
      setPrefill(ce.detail.text);
      setOpen(true);
    };
    window.addEventListener("hn:reply-prefill", handler);
    return () => window.removeEventListener("hn:reply-prefill", handler);
  }, [parentId]);

  if (!loggedIn) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>
          Reply
        </Button>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  if (compact && !open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Reply
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const text = String(fd.get("text") ?? "").trim();
    if (!text) return;
    setBusy(true);
    const res = await replyAction(parentId, text);
    setBusy(false);
    if (!res.ok) {
      toast.push(res.error, "error");
      if (res.needsLogin) setLoginOpen(true);
      return;
    }
    toast.push("Posted", "success");
    setOpen(false);
    setPrefill("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 mt-2">
      <CommentEditor
        key={prefill /* re-mount when prefill changes so the textarea picks up defaultValue */}
        defaultValue={prefill}
        busy={busy}
        onCancel={
          compact
            ? () => {
                setOpen(false);
                setPrefill("");
              }
            : undefined
        }
      />
    </form>
  );
}
