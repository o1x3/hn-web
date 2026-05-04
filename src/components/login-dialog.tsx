"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import * as React from "react";

export function LoginDialog({
  open,
  onOpenChange,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  trigger?: React.ReactNode;
}) {
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fd.get("username"),
          password: fd.get("password"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.push(json.error ?? "Login failed", "error");
        return;
      }
      toast.push(`Logged in as ${json.username}`, "success");
      onOpenChange?.(false);
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Login error", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to Hacker News</DialogTitle>
          <DialogDescription>
            Your credentials go directly to{" "}
            <a
              href="https://news.ycombinator.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              news.ycombinator.com
            </a>
            . The password is forwarded once and discarded; only the encrypted HN session cookie is
            stored on this server until you log out.{" "}
            <a
              href="https://github.com/PLACEHOLDER/PLACEHOLDER"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Read the source.
            </a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" autoComplete="username" required autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
