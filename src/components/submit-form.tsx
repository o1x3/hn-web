"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { submitAction } from "@/lib/hn/actions";
import { useRouter } from "next/navigation";
import * as React from "react";

export function SubmitForm() {
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const url = String(fd.get("url") ?? "").trim();
    const text = String(fd.get("text") ?? "").trim();
    const res = await submitAction(title, url, text);
    setBusy(false);
    if (!res.ok) {
      toast.push(res.error, "error");
      return;
    }
    toast.push("Submitted. It may take a moment to appear on /newest.", "success");
    router.push("/new");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={300} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" placeholder="https://…" />
        <p className="text-xs text-muted-foreground">
          Either a URL <em>or</em> a text post — not both.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="text">Text</Label>
        <Textarea id="text" name="text" rows={8} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
