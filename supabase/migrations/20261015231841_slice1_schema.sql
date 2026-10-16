-- =============================================================================
-- Slice 1: full MVP data model, auth profile trigger, RLS.
--
-- TODO (later slices, NOT created here):
--   - nearby_amigos(lat, lng, service_id)  -> blurred Amigo positions (slice 3)
--   - open_offers_for_me()                 -> eligible open requests for the calling Amigo (slice 5)
--   - accept_booking(booking_id)           -> atomic first-wins accept (slice 5)
--   - release_booking(booking_id)          -> give back a job >12h before start (slice 5)
--   - status-transition RPCs for job day / payment (slices 6-7)
--   - add bookings to the supabase_realtime publication (slice 5)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions & types
-- -----------------------------------------------------------------------------
create extension if not exists postgis with schema extensions;

create type public.user_role as enum ('homeowner', 'amigo');

-- 'expired' is intentionally NOT a value: expiry is computed in queries
-- (requested AND now() > scheduled_start - interval '2 hours'), never stored.
create type public.booking_status as enum (
  'requested',
  'accepted',
  'on_the_way',
  'arrived',
  'completed',
  'paid',
  'cancelled'
);

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null check (length(trim(full_name)) >= 2),
  phone       text not null check (length(trim(phone)) >= 7),
  created_at  timestamptz not null default now()
);

create table public.homeowner_details (
  homeowner_id  uuid primary key references public.profiles (id) on delete cascade,
  address       text not null,
  location      extensions.geography(Point, 4326) not null,
  created_at    timestamptz not null default now()
);

create table public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  hourly_rate  numeric(10, 2) not null check (hourly_rate > 0),
  created_at   timestamptz not null default now()
);

create table public.amigo_details (
  amigo_id           uuid primary key references public.profiles (id) on delete cascade,
  bio                text,
  home_location      extensions.geography(Point, 4326),
  service_radius_km  numeric(5, 2) not null default 5 check (service_radius_km > 0 and service_radius_km <= 50),
  is_available       boolean not null default false,
  is_verified        boolean not null default false,
  confirmed_18_plus  boolean not null default false,
  created_at         timestamptz not null default now()
);

create table public.amigo_services (
  amigo_id       uuid not null references public.amigo_details (amigo_id) on delete cascade,
  service_id     uuid not null references public.services (id) on delete restrict,
  has_equipment  boolean not null default false,
  primary key (amigo_id, service_id)
);

create table public.bookings (
  id                        uuid primary key default gen_random_uuid(),
  homeowner_id              uuid not null references public.profiles (id) on delete cascade,
  amigo_id                  uuid references public.profiles (id) on delete set null,
  service_id                uuid not null references public.services (id) on delete restrict,
  locked_hourly_rate        numeric(10, 2) not null check (locked_hourly_rate > 0),
  scheduled_start           timestamptz not null,
  estimated_hours           numeric(4, 2) not null check (estimated_hours > 0 and estimated_hours <= 12),
  job_location              extensions.geography(Point, 4326) not null,
  street_name               text,
  notes                     text,
  status                    public.booking_status not null default 'requested',
  hours_worked              numeric(4, 2) check (hours_worked > 0),
  total_amount              numeric(10, 2) check (total_amount >= 0),  -- CAD
  homeowner_marked_paid_at  timestamptz,
  accepted_at               timestamptz,
  on_the_way_at             timestamptz,
  arrived_at                timestamptz,
  completed_at              timestamptz,
  paid_at                   timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- requested => unassigned; in-progress/finished => assigned; cancelled may be either.
  constraint bookings_amigo_matches_status check (
    (status = 'requested' and amigo_id is null)
    or (status in ('accepted', 'on_the_way', 'arrived', 'completed', 'paid') and amigo_id is not null)
    or status = 'cancelled'
  ),
  constraint bookings_completed_has_totals check (
    status not in ('completed', 'paid')
    or (hours_worked is not null and total_amount is not null)
  )
);

create table public.booking_addresses (
  booking_id  uuid primary key references public.bookings (id) on delete cascade,
  address     text not null
);

create table public.booking_dismissals (
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  amigo_id    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (booking_id, amigo_id)
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index homeowner_details_location_gix on public.homeowner_details using gist (location);
create index amigo_details_home_location_gix on public.amigo_details using gist (home_location);
create index bookings_job_location_gix on public.bookings using gist (job_location);
create index bookings_status_scheduled_start_idx on public.bookings (status, scheduled_start);
create index bookings_amigo_id_idx on public.bookings (amigo_id);
create index bookings_homeowner_id_idx on public.bookings (homeowner_id);
create index bookings_service_id_idx on public.bookings (service_id);
create index amigo_services_service_id_idx on public.amigo_services (service_id);
create index booking_dismissals_amigo_id_idx on public.booking_dismissals (amigo_id);

-- -----------------------------------------------------------------------------
-- Helper: role of the calling user (used by RLS policies)
-- -----------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- -----------------------------------------------------------------------------
-- Trigger: create profile on signup (auth.users insert)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role  text := new.raw_user_meta_data ->> 'role';
  v_name  text := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  v_phone text := trim(coalesce(new.raw_user_meta_data ->> 'phone', ''));
begin
  if v_role is null or v_role not in ('homeowner', 'amigo') then
    raise exception 'Signup rejected: role must be "homeowner" or "amigo" (got %)', coalesce(v_role, 'null')
      using errcode = '22023';
  end if;
  if length(v_name) < 2 then
    raise exception 'Signup rejected: full_name is required' using errcode = '22023';
  end if;
  if length(v_phone) < 7 then
    raise exception 'Signup rejected: phone is required' using errcode = '22023';
  end if;

  insert into public.profiles (id, role, full_name, phone)
  values (new.id, v_role::public.user_role, v_name, v_phone);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Trigger: role can never change after creation (applies to every DB role)
-- -----------------------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'A profile''s role cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- -----------------------------------------------------------------------------
-- Trigger: clients can never set amigo_details.is_verified.
-- SECURITY INVOKER on purpose, so current_user is the caller's DB role.
-- Dashboard (postgres) and service_role can still verify Amigos.
-- -----------------------------------------------------------------------------
create or replace function public.protect_is_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_verified := false;
    elsif new.is_verified is distinct from old.is_verified then
      raise exception 'is_verified can only be changed by the app owner' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger amigo_details_protect_is_verified
  before insert or update on public.amigo_details
  for each row execute function public.protect_is_verified();

-- -----------------------------------------------------------------------------
-- Trigger: server-side booking defaults on insert.
-- Ignores client values for rate, location, status and lifecycle fields.
-- -----------------------------------------------------------------------------
create or replace function public.set_booking_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rate     numeric(10, 2);
  v_location extensions.geography(Point, 4326);
begin
  select s.hourly_rate into v_rate
  from public.services s
  where s.id = new.service_id;

  if v_rate is null then
    raise exception 'Unknown service' using errcode = '23503';
  end if;

  select h.location into v_location
  from public.homeowner_details h
  where h.homeowner_id = new.homeowner_id;

  if v_location is null then
    raise exception 'Set your home address before requesting a booking.' using errcode = '23502';
  end if;

  if new.scheduled_start is null or new.scheduled_start <= now() + interval '2 hours' then
    raise exception 'Bookings must start more than 2 hours from now.' using errcode = '22023';
  end if;

  new.locked_hourly_rate       := v_rate;
  new.job_location             := v_location;
  new.status                   := 'requested';
  new.amigo_id                 := null;
  new.hours_worked             := null;
  new.total_amount             := null;
  new.homeowner_marked_paid_at := null;
  new.accepted_at              := null;
  new.on_the_way_at            := null;
  new.arrived_at               := null;
  new.completed_at             := null;
  new.paid_at                  := null;
  new.created_at               := now();
  new.updated_at               := now();

  return new;
end;
$$;

revoke execute on function public.set_booking_defaults() from public, anon, authenticated;

create trigger bookings_set_defaults
  before insert on public.bookings
  for each row execute function public.set_booking_defaults();

-- -----------------------------------------------------------------------------
-- Trigger: updated_at on bookings
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Column privileges (defence in depth on top of RLS + triggers)
-- -----------------------------------------------------------------------------
-- profiles: rows are created by the auth trigger; clients may only edit name/phone.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- amigo_details: is_verified is never writable by clients.
-- amigo_id is included in UPDATE so upserts work; RLS pins it to auth.uid().
revoke insert, update on public.amigo_details from anon, authenticated;
grant insert (amigo_id, bio, home_location, service_radius_km, is_available, confirmed_18_plus)
  on public.amigo_details to authenticated;
grant update (amigo_id, bio, home_location, service_radius_km, is_available, confirmed_18_plus)
  on public.amigo_details to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.homeowner_details  enable row level security;
alter table public.services           enable row level security;
alter table public.amigo_details      enable row level security;
alter table public.amigo_services     enable row level security;
alter table public.bookings           enable row level security;
alter table public.booking_addresses  enable row level security;
alter table public.booking_dismissals enable row level security;

-- profiles ---------------------------------------------------------------------
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- services (read-only for clients) --------------------------------------------
create policy "services: read all"
  on public.services for select to authenticated
  using (true);

-- homeowner_details -------------------------------------------------------------
create policy "homeowner_details: read own"
  on public.homeowner_details for select to authenticated
  using (homeowner_id = (select auth.uid()));

create policy "homeowner_details: insert own"
  on public.homeowner_details for insert to authenticated
  with check (
    homeowner_id = (select auth.uid())
    and (select public.my_role()) = 'homeowner'
  );

create policy "homeowner_details: update own"
  on public.homeowner_details for update to authenticated
  using (homeowner_id = (select auth.uid()))
  with check (
    homeowner_id = (select auth.uid())
    and (select public.my_role()) = 'homeowner'
  );

-- amigo_details (only the Amigo themself; homeowners get nothing — Decision 16) --
create policy "amigo_details: read own"
  on public.amigo_details for select to authenticated
  using (amigo_id = (select auth.uid()));

create policy "amigo_details: insert own"
  on public.amigo_details for insert to authenticated
  with check (
    amigo_id = (select auth.uid())
    and (select public.my_role()) = 'amigo'
  );

create policy "amigo_details: update own"
  on public.amigo_details for update to authenticated
  using (amigo_id = (select auth.uid()))
  with check (
    amigo_id = (select auth.uid())
    and (select public.my_role()) = 'amigo'
  );

-- amigo_services ------------------------------------------------------------------
create policy "amigo_services: read own"
  on public.amigo_services for select to authenticated
  using (amigo_id = (select auth.uid()));

create policy "amigo_services: insert own"
  on public.amigo_services for insert to authenticated
  with check (
    amigo_id = (select auth.uid())
    and (select public.my_role()) = 'amigo'
  );

create policy "amigo_services: update own"
  on public.amigo_services for update to authenticated
  using (amigo_id = (select auth.uid()))
  with check (
    amigo_id = (select auth.uid())
    and (select public.my_role()) = 'amigo'
  );

create policy "amigo_services: delete own"
  on public.amigo_services for delete to authenticated
  using (amigo_id = (select auth.uid()));

-- bookings ---------------------------------------------------------------------------
-- No client UPDATE/DELETE policies: status changes go through RPCs in later slices.
create policy "bookings: homeowner inserts own requested"
  on public.bookings for insert to authenticated
  with check (
    homeowner_id = (select auth.uid())
    and (select public.my_role()) = 'homeowner'
    and status = 'requested'
    and amigo_id is null
  );

create policy "bookings: homeowner reads own"
  on public.bookings for select to authenticated
  using (homeowner_id = (select auth.uid()));

create policy "bookings: assigned amigo reads"
  on public.bookings for select to authenticated
  using (amigo_id = (select auth.uid()));

-- booking_addresses ----------------------------------------------------------------
create policy "booking_addresses: homeowner inserts own"
  on public.booking_addresses for insert to authenticated
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.homeowner_id = (select auth.uid())
        and b.status = 'requested'
    )
  );

create policy "booking_addresses: homeowner reads own"
  on public.booking_addresses for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.homeowner_id = (select auth.uid())
    )
  );

create policy "booking_addresses: assigned amigo reads after accept"
  on public.booking_addresses for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.amigo_id = (select auth.uid())
        and b.status <> 'requested'
    )
  );

-- booking_dismissals ---------------------------------------------------------------
create policy "booking_dismissals: read own"
  on public.booking_dismissals for select to authenticated
  using (amigo_id = (select auth.uid()));

create policy "booking_dismissals: insert own"
  on public.booking_dismissals for insert to authenticated
  with check (
    amigo_id = (select auth.uid())
    and (select public.my_role()) = 'amigo'
  );

create policy "booking_dismissals: delete own"
  on public.booking_dismissals for delete to authenticated
  using (amigo_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Seed: services
-- PLACEHOLDER rates (CAD/hour). The owner sets the real rates in the Supabase
-- dashboard (Table Editor -> services -> hourly_rate). Existing bookings keep
-- their locked_hourly_rate.
-- -----------------------------------------------------------------------------
insert into public.services (slug, name, hourly_rate) values
  ('snow-shovelling', 'Snow Shovelling', 30.00),
  ('lawn-mowing',     'Lawn Mowing',     35.00),
  ('gardening',       'Gardening',       35.00),
  ('garden-care',     'Garden Care',     30.00)
on conflict (slug) do nothing;
