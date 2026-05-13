export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "hn";
export const SITE_TAGLINE = "A modern Hacker News client";
export const SITE_DESCRIPTION =
  "A fast, open-source web client for Hacker News. Read top, new, ask, show and job stories, vote, comment and submit. Unaffiliated with Y Combinator.";
export const SITE_KEYWORDS = [
  "Hacker News",
  "HN",
  "Y Combinator",
  "tech news",
  "startups",
  "Ask HN",
  "Show HN",
  "Hacker News client",
  "Hacker News reader",
];
export const SITE_LOCALE = "en_US";
