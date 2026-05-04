"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { type Backup, exportAll, getStorageUsage, importAll, wipeAll } from "@/lib/backup";
import { clearBookmarks } from "@/lib/bookmarks/store";
import { clearHistory } from "@/lib/history/store";
import { getPref, setPref } from "@/lib/idb/prefs";
import { clearVisits } from "@/lib/replies/visit-store";
import { Download, Upload } from "lucide-react";
import * as React from "react";

const COOKIE = "hnr-settings";
type ControlPadMode = "always" | "auto" | "hide";

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
  const [padMode, setPadMode] = React.useState<ControlPadMode>("auto");
  const toast = useToast();
  const [usage, setUsage] = React.useState<Awaited<ReturnType<typeof getStorageUsage>> | null>(
    null,
  );
  const [importPreview, setImportPreview] = React.useState<{
    blob: Backup;
    mode: "merge" | "replace";
  } | null>(null);
  const [confirmingWipe, setConfirmingWipe] = React.useState(0); // 0/1/2

  const refreshUsage = React.useCallback(() => {
    getStorageUsage()
      .then(setUsage)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setSettings(readCookie());
    getPref<ControlPadMode>("controlPad.mode").then((m) => {
      if (m) setPadMode(m);
    });
    refreshUsage();
    const handler = () => refreshUsage();
    window.addEventListener("hn:visit-update", handler);
    return () => window.removeEventListener("hn:visit-update", handler);
  }, [refreshUsage]);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeCookie(next);
  }

  const onExport = async () => {
    try {
      const blob = await exportAll();
      const filename = `hn-backup-${formatStamp(new Date())}.json`;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(blob, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.push("Exported", "success");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Export failed", "error");
    }
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        setImportPreview({ blob: json as Backup, mode: "merge" });
      } catch {
        toast.push("Invalid backup file", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    try {
      const { counts } = await importAll(importPreview.blob, importPreview.mode);
      toast.push(
        `Imported: ${counts.bookmarks} bookmarks, ${counts.history} history, ${counts.highlights} highlights`,
        "success",
      );
      setImportPreview(null);
      refreshUsage();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Import failed", "error");
    }
  };

  const startWipe = () => setConfirmingWipe(1);
  const stepWipe = async () => {
    if (confirmingWipe === 1) {
      setConfirmingWipe(2);
      return;
    }
    if (confirmingWipe === 2) {
      await wipeAll();
      setConfirmingWipe(0);
      toast.push("All local data wiped", "default");
      refreshUsage();
    }
  };

  return (
    <div className="grid gap-4">
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
        <div className="border-t border-border pt-4">
          <Label>Control pad</Label>
          <p className="text-xs text-muted-foreground">
            Floating navigation panel for comment trees.
          </p>
          <div className="mt-2 flex gap-1">
            {(["always", "auto", "hide"] as ControlPadMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setPadMode(m);
                  setPref("controlPad.mode", m).catch(() => {});
                }}
                className={`rounded border px-3 py-1 text-xs ${
                  padMode === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "auto" ? "Auto (item pages)" : m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Local data</h2>
        <p className="text-xs text-muted-foreground">
          All bookmarks, history, highlights, and visit data live in your browser. We send nothing.
        </p>
        {usage ? (
          <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <li>Bookmarks: {usage.bookmarks}</li>
            <li>Visits: {usage.visits}</li>
            <li>History: {usage.history}</li>
            <li>Highlights: {usage.highlights}</li>
            <li>Prefs: {usage.prefs}</li>
            <li>
              Used: {usage.bytes ? `${(usage.bytes / 1024).toFixed(1)} KB` : "—"}
              {usage.quota ? ` / ${(usage.quota / 1024 / 1024).toFixed(0)} MB` : ""}
            </li>
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="size-3" /> Export data
          </Button>
          <label className="inline-flex">
            <input
              type="file"
              accept="application/json"
              onChange={onImportFile}
              className="hidden"
              aria-label="Import backup"
            />
            <span className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input bg-background h-8 px-3 text-xs hover:bg-accent">
              <Upload className="size-3" /> Import data
            </span>
          </label>
          <Button variant="ghost" size="sm" onClick={() => clearBookmarks().then(refreshUsage)}>
            Clear bookmarks
          </Button>
          <Button variant="ghost" size="sm" onClick={() => clearHistory().then(refreshUsage)}>
            Clear history
          </Button>
          <Button variant="ghost" size="sm" onClick={() => clearVisits().then(refreshUsage)}>
            Clear visit data
          </Button>
        </div>

        {importPreview ? (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <p className="font-medium">Preview</p>
            <ul className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
              <li>+{importPreview.blob.bookmarks?.length ?? 0} bookmarks</li>
              <li>+{importPreview.blob.visits?.length ?? 0} visits</li>
              <li>+{importPreview.blob.history?.length ?? 0} history</li>
              <li>+{importPreview.blob.highlights?.length ?? 0} highlights</li>
              <li>+{importPreview.blob.prefs?.length ?? 0} prefs</li>
            </ul>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Mode:</span>
              <button
                type="button"
                onClick={() => setImportPreview({ ...importPreview, mode: "merge" })}
                className={`rounded border px-2 py-1 ${
                  importPreview.mode === "merge"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
                }`}
              >
                Merge
              </button>
              <button
                type="button"
                onClick={() => setImportPreview({ ...importPreview, mode: "replace" })}
                className={`rounded border px-2 py-1 ${
                  importPreview.mode === "replace"
                    ? "bg-destructive text-destructive-foreground border-destructive"
                    : "border-border"
                }`}
              >
                Replace
              </button>
              <Button size="sm" onClick={confirmImport}>
                Apply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setImportPreview(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {confirmingWipe === 0 ? (
            <Button variant="destructive" size="sm" onClick={startWipe}>
              Wipe all local data
            </Button>
          ) : (
            <>
              <span className="text-xs text-destructive">Sure? Step {confirmingWipe} of 2.</span>
              <Button variant="destructive" size="sm" onClick={stepWipe}>
                {confirmingWipe === 1 ? "Confirm" : "Wipe everything"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingWipe(0)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatStamp(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}${mo}${da}-${h}${mi}`;
}
