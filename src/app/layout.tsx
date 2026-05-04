import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Header } from "@/components/header";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { SwRegister } from "@/components/sw-register";
import { readSession } from "@/lib/session";

export const metadata: Metadata = {
  title: {
    default: "hn-reddit · A Reddit-style Hacker News client",
    template: "%s · hn-reddit",
  },
  description:
    "A Reddit-style web client for Hacker News. Read, vote, comment, submit. Unaffiliated with Y Combinator.",
  applicationName: "hn-reddit",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "hn-reddit",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh bg-background text-foreground">
        <Providers>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header username={session?.username ?? null} />
          <div className="mx-auto flex w-full max-w-7xl">
            <Sidebar loggedIn={!!session?.username} pathname={pathname} />
            <main id="main" className="min-w-0 flex-1 px-4 py-4 md:px-6">
              {children}
            </main>
          </div>
          <KeyboardShortcuts />
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
