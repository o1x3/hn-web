"use client";

import { AppearanceApplier } from "@/components/appearance-applier";
import { IdbProvider } from "@/components/idb-provider";
import { ToastProvider } from "@/components/ui/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <ThemeProvider
      attribute="data-theme"
      themes={["light", "dark", "black"]}
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <ToastProvider>
          <IdbProvider>
            <AppearanceApplier />
            {children}
          </IdbProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
