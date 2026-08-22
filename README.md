# Personal Bio Page

A minimal Astro site for a personal bio page.

## Commands

```sh
npm install
npm run dev
npm run build
```

Deploy on Vercel by importing this repository and using the default Astro settings.

## Visitors

`/visitors` is a private live view of who is on the site: a globe of visitor
locations, time-range filters, durations, and a recent feed. The homepage
pings `/api/hit`, which reads Vercel's geo headers and stores the visit.

Environment variables (see `.env.example`):

- `VISITS_KEY` — the password for `/visitors`. Typed once, then remembered by
  an httpOnly cookie for six months. `/visitors?key=…` also works and is
  exchanged for the cookie.
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — injected by the Upstash Redis
  integration on Vercel. Without them visits only reach the Vercel logs.
- `VISITS_WEBHOOK_URL` — optional Slack/Discord webhook that gets each visit.
