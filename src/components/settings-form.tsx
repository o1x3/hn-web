"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import * as React from "react";

const COOKIE = "hnr-settings";

interface Settings {
  showDead: boolean;
}

function readCookie(): Settings {
  if (typeof document === "undefined") return { showDead: false };
  const m = document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return { showDead: false };
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return { showDead: false };
  }
}

function writeCookie(s: Settings) {
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(s))}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function SettingsForm() {
  const [settings, setSettings] = React.useState<Settings>({ showDead: false });
  React.useEffect(() => setSettings(readCookie()), []);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeCookie(next);
  }

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Show dead / deleted items</Label>
          <p className="text-xs text-muted-foreground">
            HN moderates flagged content. Off by default; turn on to see dimmed tombstones.
          </p>
        </div>
        <Switch
          checked={settings.showDead}
          onCheckedChange={(v: boolean) => update({ showDead: v })}
        />
      </div>
    </div>
  );
}
