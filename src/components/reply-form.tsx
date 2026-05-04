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
  const toast = useToast();
  const router = useRouter();

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

  async function onSubmit(formData: FormData) {
    const text = String(formData.get("text") ?? "").trim();
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
    router.refresh();
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-2 mt-2"
      onSubmit={(e) => {
        // Let the action handle it; React 19 supports both action="" and onSubmit.
        if (busy) e.preventDefault();
      }}
    >
      <CommentEditor busy={busy} onCancel={compact ? () => setOpen(false) : undefined} />
    </form>
  );
}
