# hn-reddit

A Reddit-style web client for Hacker News. **Unaffiliated with Y Combinator.**

Reads use the public [HN Firebase API](https://github.com/HackerNews/API) and the
[Algolia HN Search API](https://hn.algolia.com/api). User-initiated writes (login,
vote, favorite, comment, submit) are proxied through `news.ycombinator.com` on
your behalf — your password is forwarded once at login and never stored. Only your
HN session cookie is kept, encrypted at rest, until you log out.

## Quickstart

```bash
bun install
cp .env.example .env.local
# generate a 32+ char SESSION_PASSWORD and paste it in
bun run dev
```

Open http://localhost:3000.

## Scripts

```bash
bun run dev         # next dev
bun run build       # next build
bun run start       # next start
bun run typecheck   # tsc --noEmit
bun run lint        # biome check
bun run lint:fix    # biome check --write
bun run test        # vitest run
```

## Stack

- Next.js 15 (App Router, RSC, Server Actions)
- TypeScript, Tailwind v4, shadcn/ui
- TanStack Query for client islands (infinite scroll, optimistic votes)
- iron-session for encrypted cookie sessions
- linkedom for HN HTML scraping (vote `auth`, comment `hmac`, submit `fnid`)
- isomorphic-dompurify for sanitizing API HTML
- LRU cache by default; swap to Upstash Redis with `UPSTASH_REDIS_REST_URL`
- Biome for lint/format, Vitest for unit tests

## Security note

When you log in, your username and password are POSTed once to
`news.ycombinator.com/login`. The server captures the resulting `user=...` HN
session cookie and stores it in an `iron-session`-encrypted, `HttpOnly; Secure;
SameSite=Lax` cookie scoped to this app. The password is discarded immediately.
Logout clears the encrypted cookie.

The HN session cookie is treated as a bearer token: anyone with it can act as
you on HN. Encrypt your `SESSION_PASSWORD`, rotate it if compromised, and don't
deploy this without HTTPS.

## License

MIT — see [LICENSE](./LICENSE).
