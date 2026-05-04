"use client";

/**
 * Tiny toast system. Avoids the full Radix Toast bundle since we just need a
 * "5 second floating notification with a message" affordance.
 */

import { cn } from "@/lib/utils";
import * as React from "react";

export type ToastVariant = "default" | "error" | "success";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastCtx {
  push: (message: string, variant?: ToastVariant) => void;
}

const Ctx = React.createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((message: string, variant: ToastVariant = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <output
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-md border bg-card px-4 py-2 text-sm shadow-lg max-w-sm",
              t.variant === "error" && "border-destructive text-destructive",
              t.variant === "success" && "border-primary",
            )}
          >
            {t.message}
          </output>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useToast must be inside ToastProvider");
  return c;
}
