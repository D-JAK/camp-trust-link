# Migrating off Lovable Cloud to your own Supabase

There is no connection string to hand out for the Lovable Cloud backend — the database password and service-role key are not retrievable on Cloud, so migration works by rebuilding the database on your own Supabase project and pointing the app at it.

## What moves

1. **Schema** — all 9 migration files already live in the repo under `supabase/migrations/`. They contain every table, enum, index, trigger, function, grant and RLS policy. Running them in order against a fresh Supabase project reproduces the database exactly.
2. **Data** — camps (~6,375 rows), districts, taluks, LSG bodies, requirements, sources, app settings, plus any reports/check-ins/pledges collected so far. Exported as CSV per table and loaded into the new project.
3. **Storage** — the private `camp-images` bucket, recreated in the new project. Existing uploaded photos need re-uploading if you want to keep them.
4. **App wiring** — the app reads `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server) and the `VITE_` equivalents (browser). Swapping the values is the whole code change; no query or component logic changes.

## Steps

1. You create a new Supabase project in your own account and note its URL, publishable/anon key, service-role key, and database password (that project gives you a full connection string).
2. I export every table's data to CSV files you can download.
3. You apply the repo's migrations in order to the new project (via Supabase SQL editor or the Supabase CLI), then load the CSVs.
4. You create the `camp-images` storage bucket as private in the new project.
5. Point the app at the new project — either by disconnecting Lovable Cloud and setting the environment variables to your own project, or by taking the code to GitHub and running it wherever you like.

## Notes

- Disconnecting Lovable Cloud (Cloud → Advanced → Disconnect) is **irreversible** and permanently deletes the Cloud database, storage and functions. Do it only after you have confirmed the new project has all the data.
- The app runs on TanStack Start with server functions, not Supabase Edge Functions, so there is nothing to redeploy on the Supabase side beyond the database and bucket.
- Lovable's own data export is also available at Cloud → Advanced settings → Export data if you prefer a single packaged export over per-table CSVs.

## Technical details

- Env vars consumed: `src/integrations/supabase/client.ts` (browser, `VITE_*` with server fallback), `src/integrations/supabase/client.server.ts` (service role), `src/integrations/supabase/auth-middleware.ts`.
- Server code touching the database: `src/lib/reports.server.ts`, `checkins.server.ts`, `needs.server.ts`; browser reads in `src/lib/queries.ts`.
- Storage paths are `camp-images/{reportId}/{index}-{hash}.jpg`, served through signed URLs — the same path scheme works unchanged on a new bucket.
