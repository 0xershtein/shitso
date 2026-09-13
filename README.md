# shit.so

**give a shit.** Rate anyone on X with one of ten emojis. One account, one vote per person. Change it whenever they change.

Live: [shit.so](https://shit.so) (until DNS lands: [shitso.vercel.app](https://shitso.vercel.app))

Built in public by [@erendotdmg](https://x.com/erendotdmg), largely with Claude Code. This repo is the running log of that.

## How it works

- Look up any X handle → `shit.so/@handle`.
- Sign in with X, pick one of ten emojis: 💩 🧢 🤡 🐍 🤖 (bad) · 🧠 🔥 🐐 🫡 💎 (good).
- One vote per voter per target. Re-click to change, or remove it.
- **Shit score** = share of bad votes. After 3 votes a **tier** is assigned: respected → questionable → certified shit → biohazard. The page background, avatar ring and a warning banner follow the tier.
- **Shit rhythm**: votes per day over the last 14 days, with week-over-week trend.
- **Virality potential**: 0–100 from volume, 24h heat, controversy (how split the votes are) and emoji diversity.
- **Share card**: `shit.so/@handle/og.png` renders a 1200×630 image for X link previews.
- **Bot filter**: X login only, 10+ followers and a 7+ day old account. No extra backend; the numbers come from the same `users/me` call the login already makes.
- **Chrome extension** (`extension/`): shows a `💩 42% shit · 17 votes · give yours →` badge under every X profile header.
- English / Turkish, picked from `Accept-Language`, switchable in the footer.

## Stack

SvelteKit 2 · Svelte 5 · Tailwind 4 · Drizzle + Neon Postgres · Auth.js (X OAuth 2.0) · satori + resvg for OG images · Vercel.

## Run it

```bash
pnpm install
cp .env.example .env.local   # fill DATABASE_URL, AUTH_SECRET, AUTH_TWITTER_ID, AUTH_TWITTER_SECRET
pnpm db:push
pnpm dev
```

X app setup: create an app at [console.x.com](https://console.x.com), OAuth 2.0, type "Web App", callback `http://localhost:5173/auth/callback/twitter`, permission "Read".

Optional: `GIPHY_API_KEY` or `TENOR_API_KEY` enables a reaction gif per tier.

## Extension

`chrome://extensions` → Developer mode → Load unpacked → pick `extension/`.

## API

`GET /api/v1/:handle` → `{ handle, total, shitScore, tier, virality, last24h, top, counts, url }`. CORS open, cached 30s.

## License

Apache-2.0
