# Flex Crew OS

Candidate prototype — Supply Lifecycle Platform. Not an official Flex product.

Gymdesk Retention OS shell · one reliability engine · three synchronized columns.

## Stack

Next.js 15 · TypeScript · Tailwind v4 · shadcn-style UI · Framer Motion · Recharts/lucide

## Develop

```bash
npm install
npm run dev
```

## Verify

```bash
npm run build

curl -s -X POST http://localhost:3000/api/score \
  -H 'content-type: application/json' \
  -d '{"signals":{"onTimeRate":0.80,"avgRating":4.30,"acceptanceRate":0.38,"jobsCompleted":5,"lateCancellations":1,"noShows":0}}'
```

## Branding

Logo at `public/logo-flex.png`. `--primary` / `--brand` = Flex blue `#2360f9` (chrome + primary button only).
