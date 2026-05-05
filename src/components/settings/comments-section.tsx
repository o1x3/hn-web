"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getPref, setPref, usePref } from "@/lib/idb/prefs";
import { cn } from "@/lib/utils";
import * as React from "react";

const DEPTHS: { value: number | null; label: string }[] = [
  { value: null, label: "Off" },
  { value: 3, label: "Beyond 3" },
  { value: 5, label: "Beyond 5" },
  { value: 8, label: "Beyond 8" },
];

export function CommentsSection() {
  const threshold = usePref<number | null>("comments.autoCollapseDepth");
  const persist = usePref<boolean>("comments.persistCollapse");
  const [persistLocal, setPersistLocal] = React.useState<boolean>(true);

  React.useEffect(() => {
    getPref<boolean>("comments.persistCollapse").then((v) => {
      if (v != null) setPersistLocal(v);
    });
  }, []);

  React.useEffect(() => {
    if (persist != null) setPersistLocal(persist);
  }, [persist]);

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">Comments</h2>
        <p className="text-xs text-muted-foreground">
          Trim noise and persist your collapse decisions across visits.
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Auto-collapse deep replies</Label>
        <div className="flex flex-wrap gap-2">
          {DEPTHS.map((t) => {
            const active = (threshold ?? null) === t.value;
            return (
              <button
                key={String(t.value)}
                type="button"
                onClick={() => setPref("comments.autoCollapseDepth", t.value).catch(() => {})}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Comments deeper than this depth start collapsed; tap to expand.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Persist collapse state</Label>
          <p className="text-xs text-muted-foreground">
            Remember which sub-threads you've collapsed across page loads.
          </p>
        </div>
        <Switch
          checked={persistLocal}
          onCheckedChange={(v) => {
            setPersistLocal(v);
            setPref("comments.persistCollapse", v).catch(() => {});
          }}
        />
      </div>
    </section>
  );
}
