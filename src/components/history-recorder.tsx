"use client";

import { recordVisit } from "@/lib/history/store";
import type { HistoryKind } from "@/lib/idb/schema";
import * as React from "react";

/** Records a visit to history once per mount. */
export function HistoryRecorder({
  kind,
  refId,
  title,
}: {
  kind: HistoryKind;
  refId: string;
  title?: string;
}) {
  React.useEffect(() => {
    recordVisit({ kind, refId, title }).catch(() => {});
  }, [kind, refId, title]);
  return null;
}
