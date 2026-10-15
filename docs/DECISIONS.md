# Decisions log

| # | Date | Decision | Why | Revisit when |
|---|---|---|---|---|
| 1 | 2026-10-14 | React Native + Expo, built with Claude Code; planning in a Claude Project | Near-zero budget, one codebase for Android and iOS, cloud builds from Windows | — |
| 2 | 2026-10-14 | One app with two roles (homeowner / amigo) | Halves build and test effort | If Amigo features grow large |
| 3 | 2026-10-14 | Supabase (auth, Postgres + PostGIS, realtime) | Free tier covers MVP; RLS for privacy; PostGIS for distance matching | Usage nears free-tier limits |
| 4 | 2026-10-14 | MVP payment = cash / Interac e-Transfer, tracked in app | Card payouts need Stripe Connect onboarding and per-transaction fees | Phase 2 |
| 5 | 2026-10-14 | **Uber-style matching**: homeowner requests, app broadcasts to eligible Amigos, first to accept wins | Owner's chosen workflow; works with few Amigos | If too many Amigos compete for each job |
| 6 | 2026-10-14 | **Standard hourly rate per service**, set by owner, locked at request time | Required for auto-matching; simple and predictable | Phase 2 (dynamic pricing) |
| 7 | 2026-10-14 | **Scheduled jobs only**, no on-demand | Owner's choice; removes need for live tracking to match | Phase 2 |
| 8 | 2026-10-14 | Matching by Amigo home base + service radius (default 5 km), not live location | Scheduled jobs don't need live position; better privacy and battery | — |
| 9 | 2026-10-14 | Map pins blurred ~500 m; full address revealed only after acceptance | Protects both sides' privacy | — |
| 10 | 2026-10-14 | Unaccepted requests expire 2h before start; expiry computed in queries | No scheduled jobs needed; expired requests = demand data | — |
| 11 | 2026-10-14 | Push notifications in MVP as slice 8 via development build; slices 1–7 in Expo Go | Dispatch needs alerts, but Expo Go is faster for core build | — |
| 12 | 2026-10-14 | Amigos self-register and are verified manually; must be 18+ | No existing professional list; trust and liability | Phase 2 admin dashboard |
| 13 | 2026-10-14 | Recruit 5–10 verified Amigos before inviting homeowners; early users double as Play closed-test testers | Supply first solves cold start; overlaps the 14-day test | — |
| 14 | 2026-10-14 | Push notifications are Android-only for MVP; iPhone testers use Expo Go without push | iOS development builds require the paid Apple Developer Program | When adding iOS store release |
| 15 | 2026-10-14 | Accept the one-time US$25 Google Play Console fee | Required for the Play closed test and public launch | — |
| 16 | 2026-10-14 | Map reads Amigo locations only via a blurring `security definer` RPC; `amigo_details` not readable by homeowners | RLS limits rows, not columns | — |
| 17 | 2026-10-14 | `street_name` stored on bookings for offers; full address stays in `booking_addresses` | Offers need street context without revealing the address | — |
| 18 | 2026-10-14 | Keep Supabase active during closed test (regular use or free uptime ping) | Free projects pause after ~1 week idle | Moving to a paid plan |
