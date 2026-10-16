-- =============================================================================
-- Fix: this project does NOT auto-grant table privileges to anon/authenticated.
-- Grant exactly what the slice 1 RLS policies need, and move the RLS helper
-- my_role() out of the exposed API schema into schema private.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Strip unneeded privileges
-- -----------------------------------------------------------------------------
revoke all on table
  public.profiles,
  public.services,
  public.homeowner_details,
  public.amigo_details,
  public.amigo_services,
  public.bookings,
  public.booking_addresses,
  public.booking_dismissals
from anon;

revoke truncate, trigger, references on table
  public.profiles,
  public.services,
  public.homeowner_details,
  public.amigo_details,
  public.amigo_services,
  public.bookings,
  public.booking_addresses,
  public.booking_dismissals
from authenticated;

-- -----------------------------------------------------------------------------
-- 2. Grant to authenticated exactly what the RLS policies need.
-- Existing column grants from slice 1 are kept (table-level revokes don't touch them):
--   profiles:      update (full_name, phone)
--   amigo_details: insert/update (amigo_id, bio, home_location, service_radius_km,
--                  is_available, confirmed_18_plus) -- never is_verified
-- -----------------------------------------------------------------------------
grant select                         on public.profiles           to authenticated;
grant select                         on public.services           to authenticated;
grant select, insert, update         on public.homeowner_details  to authenticated;
grant select                         on public.amigo_details      to authenticated;
grant select, insert, update, delete on public.amigo_services     to authenticated;
grant select, insert                 on public.bookings           to authenticated;
grant select, insert                 on public.booking_addresses  to authenticated;
grant select, insert, delete         on public.booking_dismissals to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Move the RLS helper out of the API (schema private is not exposed by PostgREST).
-- Policies reference the function by OID, so they keep working after the move.
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.my_role() set schema private;

-- Re-assert function privileges (they move with the function, but be explicit).
revoke execute on function private.my_role() from public, anon;
grant execute on function private.my_role() to authenticated;
