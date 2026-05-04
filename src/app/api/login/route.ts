/**
 * Login proxy.
 *
 * POSTs the user's credentials once to news.ycombinator.com/login. Captures
 * the resulting `user=...` HN session cookie from `Set-Cookie`. Stores ONLY
 * that cookie (encrypted by iron-session). Discards the password immediately.
 *
 * FRAGILE: HN returns 200 with a "Bad login." body on auth failure, not a
 * non-200 status. Detect via body text.
 */

import { hnFetch } from "@/lib/fetcher";
import { isBadLogin, isValidationRequired } from "@/lib/hn/scrape";
import { getSession } from "@/lib/session";
import { type NextRequest, NextResponse } from "next/server";

const HN_LOGIN = "https://news.ycombinator.com/login";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
  }

  const body = new URLSearchParams({ acct: username, pw: password, goto: "news" });

  const res = await hnFetch(HN_LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    redirect: "manual",
  });

  // Extract the `user` cookie from any Set-Cookie header value.
  const setCookies = extractSetCookies(res.headers);
  const userCookie = setCookies
    .map((c) => /^user=([^;]+)/.exec(c)?.[1])
    .find((v): v is string => !!v && v !== "" && v !== "x");

  if (!userCookie) {
    // No cookie → bad credentials, captcha challenge, or unexpected response.
    const html = await res.text().catch(() => "");
    if (isBadLogin(html)) {
      return NextResponse.json({ ok: false, error: "Bad login" }, { status: 401 });
    }
    if (isValidationRequired(html)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "HN is asking for a captcha (anti-bot). Sign in at news.ycombinator.com once, then come back.",
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Login response missing session cookie" },
      { status: 502 },
    );
  }

  const session = await getSession();
  session.hnCookie = userCookie;
  session.username = username;
  session.loggedInAt = Math.floor(Date.now() / 1000);
  await session.save();

  return NextResponse.json({ ok: true, username });
}

/**
 * Pull all `Set-Cookie` headers as separate strings. Node's Headers folds
 * multiple Set-Cookie values into one string with commas, which is wrong for
 * `Expires=...` dates that contain commas. Use getSetCookie when available.
 */
function extractSetCookies(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}
