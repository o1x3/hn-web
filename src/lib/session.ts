import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  /** HN session cookie value (the `user=...` value), encrypted at rest. */
  hnCookie?: string;
  /** Username, surfaced for UI. Authoritative source is still HN. */
  username?: string;
  /** Last activity unix seconds, for proactive expiry. */
  loggedInAt?: number;
}

const SESSION_COOKIE_NAME = "hnr-session";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD ?? "",
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  if (!process.env.SESSION_PASSWORD || process.env.SESSION_PASSWORD.length < 32) {
    throw new Error(
      "SESSION_PASSWORD env var is missing or shorter than 32 chars; refusing to create a session.",
    );
  }
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/** Convenience: read session without throwing on misconfig (for read-only paths). */
export async function readSession(): Promise<SessionData | null> {
  try {
    const s = await getSession();
    return { hnCookie: s.hnCookie, username: s.username, loggedInAt: s.loggedInAt };
  } catch {
    return null;
  }
}
