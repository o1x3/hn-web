"use client";

import { LoginDialog } from "@/components/login-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

export function UserMenu({ username }: { username: string | null }) {
  const [loginOpen, setLoginOpen] = React.useState(false);
  const router = useRouter();

  if (!username) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
          Sign in
        </Button>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="size-4" />
          {username}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Logged in as {username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/user/${username}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/threads">Threads</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/favorites">Favorites</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/upvoted">Upvoted</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/submitted">Submitted</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <LogOut className="size-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
