import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractCommentHmac,
  extractSubmitFormTokens,
  extractVoteAuth,
  isBadLogin,
  isLoggedIn,
  isValidationRequired,
  parsePersonalizedPage,
} from "@/lib/hn/scrape";
import { describe, expect, it } from "vitest";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const read = (name: string) => readFileSync(join(FIXTURES, name), "utf8");

describe("extractVoteAuth", () => {
  it("pulls auth token from upvote anchor", () => {
    const html = read("item.html");
    expect(extractVoteAuth(html, 42)).toBe("ABC123FAKETOKEN");
  });
  it("returns null for unknown id", () => {
    const html = read("item.html");
    expect(extractVoteAuth(html, 9999)).toBeNull();
  });
});

describe("extractCommentHmac", () => {
  it("pulls hmac from reply form", () => {
    const html = read("comment-form.html");
    expect(extractCommentHmac(html)).toBe("HMACFAKE9999");
  });
});

describe("extractSubmitFormTokens", () => {
  it("pulls fnid and fnop", () => {
    const html = read("submit.html");
    const tokens = extractSubmitFormTokens(html);
    expect(tokens).toEqual({ fnid: "FNIDFAKE0001", fnop: "submit-page" });
  });
});

describe("login state detection", () => {
  it("detects bad login page", () => {
    expect(isBadLogin(read("login-bad.html"))).toBe(true);
  });
  it("detects logged in pages by logout link", () => {
    expect(isLoggedIn(read("logged-in.html"))).toBe(true);
    expect(isLoggedIn(read("login-bad.html"))).toBe(false);
  });
  it("detects HN's anti-bot captcha challenge", () => {
    expect(isValidationRequired(read("login-captcha.html"))).toBe(true);
    expect(isValidationRequired(read("login-bad.html"))).toBe(false);
    expect(isValidationRequired(read("logged-in.html"))).toBe(false);
  });
});

describe("parsePersonalizedPage", () => {
  it("parses comment rows from /threads", () => {
    const rows = parsePersonalizedPage(read("threads.html"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 100, type: "comment", author: "alice" });
  });
  it("parses story rows from /submitted", () => {
    const rows = parsePersonalizedPage(read("submitted.html"));
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const a = rows.find((r) => r.id === 200);
    expect(a).toBeTruthy();
    expect(a?.type).toBe("story");
    expect(a?.title).toBe("Story A");
    expect(a?.url).toBe("https://example.com/a");
  });
});
