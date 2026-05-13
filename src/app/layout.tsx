import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AppearanceScript } from "@/components/appearance-script";
import { Header } from "@/components/header";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Providers } from "@/components/providers";
import { SelectionPopup } from "@/components/selection-popup";
import { Sidebar } from "@/components/sidebar";
import { SwRegister } from "@/components/sw-register";
import { readSession } from "@/lib/session";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  manifest: "/manifest.webmanifest",
  category: "news",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/rss/top", title: "hn — Top stories" },
        { url: "/rss/new", title: "hn — New stories" },
        { url: "/rss/best", title: "hn — Best stories" },
      ],
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: SITE_LOCALE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
  colorScheme: "light dark",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: SITE_TAGLINE,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
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
    <html lang="en" suppressHydrationWarning className={sourceSerif.variable}>
      <head>
        <AppearanceScript />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-svh bg-background text-foreground">
        <Providers>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header username={session?.username ?? null} />
          <div
            className="mx-auto flex w-full"
            style={{ maxWidth: "var(--reader-content-width, 80rem)" }}
          >
            <Sidebar
              loggedIn={!!session?.username}
              pathname={pathname}
              username={session?.username ?? null}
            />
            <main id="main" className="min-w-0 flex-1 px-4 py-4 md:px-6">
              {children}
            </main>
          </div>
          <KeyboardShortcuts />
          <SelectionPopup />
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
