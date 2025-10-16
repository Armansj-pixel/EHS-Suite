
# EHS Suite Starter (Next.js + Tailwind + Firebase)

Ready to deploy to **Vercel**.

## Quick Start
1. `npm i`
2. `npm run dev`
3. Open http://localhost:3000

## Deploy to Vercel
- Push to GitHub then import on https://vercel.com → New Project → Import
- Or use Vercel CLI: `npm i -g vercel` → `vercel`

## Firebase
- Authentication (Email/Password) ON
- Firestore ON
- Storage ON (if bucket init fails, switch to `ehs-suite-fedff.appspot.com`)

## Structure
- `/app/(auth)/login` → Login page
- `/app/(dashboard)` → KPI cards
- `/lib/firebase.ts` → Firebase init with your config
