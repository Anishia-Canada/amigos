# Amigos — Project Spec (MVP)

## One-liner
"Uber for yard work." Homeowners in Doon South, Kitchener request snow shovelling, lawn mowing, gardening or garden care for a scheduled time. The app matches the job to a nearby, verified gig worker ("Amigo") who owns the equipment.

## Users
- **Homeowner**: wants outdoor chores done reliably without hunting for help.
- **Amigo**: a local gig worker (18+) with time, equipment and know-how, who wants nearby paid jobs.

One app, two roles. Role is chosen at signup and decides which tabs the user sees.

## Core model: Uber-style matching, scheduled jobs
- The homeowner does **not** pick a specific Amigo. They request a service; the **app matches** it.
- **Pricing:** one standard hourly rate per service, set by the owner (stored in `services.hourly_rate`, CAD). The rate is locked into the booking at request time.
- **Timing:** scheduled only (date + start time). No on-demand "now" jobs.
- **Matching:** the request is broadcast to every eligible Amigo; **first to accept wins**.

### Eligible Amigo for a request
- `is_verified = true` and `is_available = true`
- Offers the requested service
- Homeowner's address is within the Amigo's service radius of their home base
- No accepted booking overlapping the requested time window. A booking occupies `scheduled_start` to `scheduled_start + estimated_hours`. Overlap is checked inside the atomic accept RPC (`accept_booking`), which also requires `status = 'requested'` and not expired.

## Launch scope
- Neighbourhood: Doon South, Kitchener (matching is by distance, so expansion needs no code change).
- Services: Snow Shovelling, Lawn Mowing, Gardening, Garden Care.

## Critical flows

### Homeowner
1. Set home address once. The app converts it to coordinates with the phone's geocoder.
2. **Map screen:** pins for verified, available Amigos near them (positions blurred to roughly 500 m for privacy), filterable by service. This shows the service is live in their area.
3. **Request:** choose service, date and start time, estimated hours, notes. See the standard rate and estimated total (rate × estimated hours). Tap **Request**.
4. Status shows "Finding an Amigo…" until someone accepts, then the Amigo's first name, photo/initials and phone number.
5. Track live: Accepted → On the way → Arrived → Completed.
6. After completion, see the final total (hours worked × locked rate), pay by cash or Interac e-Transfer, then tap **"I've paid"**.
7. If nobody accepts in time, the request expires and the homeowner is told no Amigo was available.

### Amigo
1. **Onboarding:** services offered, equipment yes/no, home base (address or current location), service radius (default 5 km), 18+ confirmation. Then a "Pending verification" screen until the owner verifies them.
2. **Go available / unavailable** toggle.
3. **Job offers:** open requests they're eligible for, showing service, date/time, estimated hours, rate, estimated earnings, and distance + street name (not the full address). **Accept** or **Dismiss**.
4. Accepting is atomic: if another Amigo got there first, show "This job was taken."
5. **Schedule:** accepted jobs, now with full address.
6. **Job day:** tap **On my way** → **Arrived** → **Complete** (enter hours worked) → **Payment received**.
7. **Release job:** an Amigo can give back an accepted job more than 12 hours before the start; it returns to the open pool and the homeowner's status goes back to "Finding an Amigo…". It still expires 2 hours before start if nobody else accepts.

## Booking status rules
| Status | Set by | Allowed next |
|---|---|---|
| requested | homeowner | accepted, cancelled, expired |
| accepted | amigo (atomic, first wins) | on_the_way, cancelled, requested (Amigo release, >12h before start) |
| on_the_way | amigo | arrived |
| arrived | amigo | completed |
| completed | amigo (enters hours_worked) | paid |
| paid | amigo (confirms receipt) | — |
| cancelled | homeowner (before on_the_way) | — |
| expired | system | — |

- A `requested` booking expires if not accepted **2 hours before** `scheduled_start`. Expiry is computed in queries (treat as expired when `now() > scheduled_start - 2h`); no scheduled jobs needed.
- "I've paid" sets `homeowner_marked_paid_at` only. The Amigo's confirmation moves the booking to `paid`.
- Expired bookings double as the unmet-demand log for recruiting Amigos.

## Screens (MVP)
**Shared:** Welcome (role choice) · Sign up / Log in · Profile setup

**Homeowner tabs**
- Home: map of nearby Amigos + service filter + "Request" button
- Request form
- My bookings: list with status; detail screen with status timeline, Amigo contact, total, "I've paid"

**Amigo tabs**
- Offers: eligible open requests, Accept / Dismiss
- Schedule: accepted and in-progress jobs; job detail with status buttons
- Profile: services, equipment, home base, radius, availability toggle

## Data model (Supabase / Postgres + PostGIS)
- `profiles`: id (= auth user id), role (`homeowner` | `amigo`), full_name, phone, created_at
- `homeowner_details`: homeowner_id (pk), address, location (geography point)
- `services`: id, slug, name, hourly_rate (seeded; owner edits rates in dashboard)
- `amigo_details`: amigo_id (pk), bio, home_location (geography point), service_radius_km, is_available, is_verified, confirmed_18_plus
- `amigo_services`: amigo_id, service_id, has_equipment (pk amigo_id + service_id)
- `bookings`: id, homeowner_id, amigo_id (null until accepted), service_id, locked_hourly_rate, scheduled_start, estimated_hours, job_location (geography point), street_name (shown to eligible Amigos in offers), notes, status, hours_worked, total_amount, homeowner_marked_paid_at, accepted_at, on_the_way_at, arrived_at, completed_at, paid_at, created_at, updated_at
- `booking_addresses`: booking_id (pk), address — readable by the assigned Amigo only after acceptance
- `booking_dismissals`: booking_id, amigo_id — hides dismissed offers

## Privacy & trust rules
- Map pins show blurred Amigo locations, never exact home bases. Homeowners can never read `amigo_details` directly; the map reads only through the `nearby_amigos` RPC, which returns rounded coordinates.
- Full address is hidden from Amigos until they accept; offers show distance and street name only.
- Phone numbers are exchanged only on accepted bookings.
- Only verified Amigos appear on the map or receive offers. Verification is manual in the Supabase dashboard for the MVP.
- Amigos must be 18+.
- Row Level Security on every table.

## Build slices (in order)
1. Scaffold, Supabase schema, auth, role-based routing
2. Amigo onboarding + pending verification
3. Homeowner address + map of nearby Amigos
4. Request flow (standard rate, estimated total)
5. Amigo offers + atomic accept + realtime status for homeowner
6. Job day statuses (On my way / Arrived / Complete)
7. Payment confirmation (I've paid / Payment received)
8. Push notifications (new offer, accepted, on my way) — **Android only for MVP** via a development build; iPhone users stay on Expo Go without push
9. Stretch: Amigo's live location on the homeowner's map while "On my way"

## Out of scope for MVP (Phase 2+)
In-app card payments (Stripe Connect) · on-demand "now" jobs · ratings and reviews · in-app chat · recurring bookings · admin dashboard · surge or dynamic pricing · photos of completed work.

## Costs and operational notes
- Google Play Console: one-time US$25 (the only planned cost).
- Apple Developer Program (US$99/year) is **not** planned for MVP; iOS testing uses Expo Go.
- Supabase free projects pause after about a week with no activity. Keep the app in use during the closed test, or set up a free uptime ping.

## Before a public launch (non-code)
Terms of service and privacy policy, liability/insurance position for Amigos working on private property, Amigo identity checks, and the standard rates per service.
