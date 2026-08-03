# Relief Camp Verification Platform

A crowdsourced platform for Kerala flood relief camps where every fact carries a
verification chain — who reported it, when, and from which source.

Public users can find nearby camps, see verified status and contacts, check in with
their family, and pledge against a camp's requirements. Volunteers submit OTP-verified
reports with photos that are checked for quality and duplicates.

## Features

- Camp directory over 14 districts, 78 taluks and 1,182 local bodies, seeded from the
  official monsoon camp sheet (~6,375 camps)
- Filters by district / taluk / local body, status, verification state, facilities and
  free text — all encoded in the URL and shareable
- Card and list views with pagination, distance ranking from the user's location
- Camp detail: interactive map, directions, contacts, photos, amenities, occupancy
- Verification state on every camp (verified vs community reported) with source and
  last-confirmed timestamp
- OTP-verified community reporting: status, occupancy, photos with blur / brightness /
  EXIF / duplicate-hash checks, plus duplicate camp detection (150 m or 0.85 name match)
- Check-ins with people and children counts, rate limited to one per phone and one per
  IP per camp per day
- Requirements tab: per-camp needs with quantities, urgency and OTP-verified pledges
- Helplines and emergency contacts, weather panel
- English / Malayalam, light and dark themes, mobile-first responsive layout

## Tech stack

- TanStack Start (React 19, TanStack Router, server functions) + Vite 7
- TypeScript, Tailwind CSS v4, shadcn/ui
- TanStack Query for data fetching and caching
- Supabase (Postgres with RLS, auth, private storage)
- Leaflet + OpenStreetMap for maps

## Getting started

Requires Node.js 20+ (or Bun) and a Supabase project.

```sh
git clone <repository-url>
cd <repository-name>
npm install
npm run dev
```

The app runs at `http://localhost:8080`.

### Environment

Create a `.env` file:

```sh
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

Server-only secrets (used inside server functions) are read from the runtime
environment and must never be exposed with a `VITE_` prefix.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the codebase |
| `npm run format` | Format with Prettier |

## Project structure

```
src/
  routes/          File-based routes (list, camp detail, report, helplines)
  components/      Camp cards, filters, map, check-in, donate, badges, UI kit
  lib/             Server functions (*.functions.ts), server logic (*.server.ts),
                   queries, i18n, image processing, formatting, geolocation
  integrations/    Generated Supabase client and types
supabase/
  migrations/      SQL schema, RLS policies, grants, triggers and seed data
docs/
  PRD.md           Product requirements
```

## Database

Schema, row-level security policies, grants, triggers and seed data live in
`supabase/migrations/`. Core tables: `districts`, `taluks`, `lsg_bodies`, `camps`,
`reports`, `camp_checkins`, `camp_needs`, `need_pledges`, `sources` and an audit log.
Camp images are stored in a private bucket and served through signed URLs.

## Data and accuracy

Camp records sourced from government lists are labelled as such. The platform does not
claim official status, and unverified camps are shown as community reported — always
call a camp before travelling.

## License

MIT
