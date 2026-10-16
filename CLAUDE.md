# CLAUDE.md — Amigos app

Read `docs/PROJECT_SPEC.md` before any feature work. Log significant choices in `docs/DECISIONS.md`. Build in the slice order listed in the spec.

## Stack
- Expo (latest SDK) + React Native + **TypeScript**
- **Expo Router** (file-based routing)
- **Supabase**: auth (email + password), Postgres with **PostGIS**, Row Level Security, Realtime for live booking status
- Session storage via `@react-native-async-storage/async-storage`; follow Supabase's official Expo/React Native setup
- Maps: `react-native-maps` · Location and geocoding: `expo-location` (device geocoder, free)
- Date/time picking: `@react-native-community/datetimepicker`
- Push (slice 8 only): `expo-notifications`

## Hard constraints
- **Zero budget.** Free tiers only. No paid APIs (no paid geocoding services).
- **Slices 1–7 must run in Expo Go.** Only Expo Go–compatible libraries. Install with `npx expo install <pkg>`.
- Slice 8 (push) is **Android only**, using a development build via EAS; iOS stays on Expo Go. Explain the steps when we get there.
- Before the first EAS build, flag what map configuration Android builds need (e.g. a Google Maps API key) and how to get it at no cost.
- Developer is on **Windows + Git Bash**. Give commands that work in Git Bash.
- Stay within the MVP. If a task needs something listed as Phase 2, stop and ask.

## Project structure
```
src/app/
  _layout.tsx            # root: auth gate, routes by role
  (auth)/                # welcome, sign-in, sign-up, profile setup
  (homeowner)/           # tabs: home (map), bookings
  (amigo)/               # tabs: offers, schedule, profile
src/components/
src/lib/supabase.ts          # single Supabase client
src/lib/database.types.ts    # generated; never edit by hand — run: npx supabase gen types typescript --linked > src/lib/database.types.ts
src/lib/bookings.ts          # booking reads/writes + status transitions
src/lib/location.ts          # geocoding, permissions, coordinate blurring
supabase/migrations/         # all schema changes; see Workflow
```

## Matching & booking rules (enforce in the database)
- Use **Postgres functions called via `supabase.rpc`** for anything that must be safe under concurrency or hidden by RLS:
  - `nearby_amigos(lat, lng, service_id)` → blurred positions only
  - `open_offers_for_me()` → eligible requests for the calling Amigo (service match, within radius, not dismissed, no time overlap, not expired)
  - `accept_booking(booking_id)` → one atomic function: re-check eligibility and that the Amigo has no overlapping accepted job, then `UPDATE ... WHERE id = $1 AND status = 'requested' AND amigo_id IS NULL`; returns whether this Amigo won
  - `release_booking(booking_id)` → only >12h before start; sets status back to `requested` and clears `amigo_id`
- RPCs that expose data across users are `security definer` with a fixed `search_path`, and validate `auth.uid()` inside.
- RLS: `amigo_details` and `amigo_services` rows are readable/writable only by that Amigo. Homeowners never select them directly.
- Never write `expired` to the database; it is a computed state only.
- Expiry is computed, not scheduled: `requested` bookings past `scheduled_start - interval '2 hours'` are treated as `expired` in all queries.
- Lock the rate by copying `services.hourly_rate` into `bookings.locked_hourly_rate` at request time. Never recompute.
- `total_amount = hours_worked * locked_hourly_rate`, rounded to 2 decimals, CAD.
- Overlap window for an Amigo = `scheduled_start` to `scheduled_start + estimated_hours`.
- Store times as `timestamptz`; display in America/Toronto.

## Conventions
- Functional components and hooks. Keep screens thin; data access in `lib/`.
- All status changes go through `lib/bookings.ts`, matching the transition table in the spec.
- Every screen handles loading, empty, and error states.
- Plain StyleSheet; large touch targets; no UI library unless asked.

## Secrets
- `.env` holds `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; `.env` is in `.gitignore`.
- **Never** put the Supabase `service_role` key in the app or in git.

## Workflow
- One slice at a time. After each slice: explain how to test it in Expo Go (including with two test accounts: one homeowner, one Amigo), wait for confirmation, then suggest a git commit message.
- All schema changes go in new migration files under `supabase/migrations/`; never edit an already-pushed migration; never run `npx supabase db push` without asking me.
- This project does not auto-grant privileges. Every new table needs explicit GRANTs matching its RLS policies, and every new RPC needs explicit GRANT EXECUTE to authenticated (revoke from public, anon). Helper functions used only inside policies go in schema private.
- Run `npx tsc --noEmit` and `npx expo lint` before calling a slice done.

## Commands
- Dev server: `npx expo start` (`--tunnel` if the phone can't connect)
- Type check: `npx tsc --noEmit`
- Android test build: `eas build -p android --profile preview`
