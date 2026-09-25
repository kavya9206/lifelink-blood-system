-- LifeLink — Supabase Postgres schema
-- ─────────────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run).
-- Creates all LifeLink tables in `public`. Requires Supabase Auth
-- to be enabled (default). Tables use RLS so anonymous access is blocked
-- — the Flask API uses the service_role key instead. Row Level Security
-- is intentionally disabled; the backend enforces authorization.
-- ─────────────────────────────────────────────────────────────────

-- blood groups / cities (enumerations)
CREATE TYPE blood_group AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE urgency AS ENUM ('normal','urgent','critical');
CREATE TYPE request_status AS ENUM ('pending','approved','fulfilled','rejected');
CREATE TYPE user_role AS ENUM ('donor','recipient','hospital','admin');
CREATE TYPE gender AS ENUM ('Male','Female','Other');

-- users — linked to supabase auth.users via id; stores app profile
CREATE TABLE IF NOT EXISTS public.users (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  email        text        NOT NULL UNIQUE,
  phone        text,
  role         user_role   NOT NULL DEFAULT 'donor',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- donors
CREATE TABLE IF NOT EXISTS public.donors (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  name          text        NOT NULL,
  age           int         NOT NULL CHECK (age >= 0 AND age <= 110),
  gender        gender      NOT NULL,
  blood_group   blood_group NOT NULL,
  phone         text        NOT NULL,
  email         text        NOT NULL,
  city          text        NOT NULL,
  address       text        NOT NULL,
  last_donation date,
  available     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON public.donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_city ON public.donors(city);
CREATE INDEX IF NOT EXISTS idx_donors_available ON public.donors(available);
CREATE INDEX IF NOT EXISTS idx_donors_user_id ON public.donors(user_id);

-- donation history
CREATE TABLE IF NOT EXISTS public.donation_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id   uuid        NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  date       date        NOT NULL,
  location   text        NOT NULL,
  units      int         NOT NULL CHECK (units > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_donation_history_donor_id ON public.donation_history(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_history_date ON public.donation_history(date DESC);

-- blood requests
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name  text          NOT NULL,
  blood_group   blood_group   NOT NULL,
  units         int           NOT NULL CHECK (units > 0 AND units <= 50),
  hospital_name text          NOT NULL,
  hospital_city text          NOT NULL,
  contact       text          NOT NULL,
  needed_by     date          NOT NULL,
  urgency       urgency       NOT NULL DEFAULT 'normal',
  notes         text          DEFAULT '',
  status        request_status NOT NULL DEFAULT 'pending',
  requested_by  uuid          REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON public.blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital_city ON public.blood_requests(hospital_city);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at ON public.blood_requests(created_at DESC);

-- inventory
CREATE TABLE IF NOT EXISTS public.inventory (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_group          blood_group NOT NULL,
  facility             text        NOT NULL,
  city                 text        NOT NULL,
  units                int         NOT NULL DEFAULT 0 CHECK (units >= 0),
  low_stock_threshold  int         NOT NULL DEFAULT 8,
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_blood_group ON public.inventory(blood_group);
CREATE INDEX IF NOT EXISTS idx_inventory_city ON public.inventory(city);
-- one row per blood group per facility is the intended model
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_facility_group ON public.inventory(facility, blood_group);

-- hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text         NOT NULL,
  city            text         NOT NULL,
  address         text         NOT NULL,
  phone           text         NOT NULL,
  emergency_24x7  boolean      NOT NULL DEFAULT false,
  -- array of blood groups (array ENUM is not supported, store as text[] validated in backend)
  groups          text[]       NOT NULL DEFAULT '{O+}',
  created_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON public.hospitals(city);

-- keep updated_at on inventory in sync automatically
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_inventory_touch ON public.inventory;
CREATE TRIGGER trg_inventory_touch
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- RLS: disabled — Flask API authenticates with service_role and enforces
-- authorization in application logic. Enable and write policies later if
-- you switch to PostgREST direct browser access via anon key.
-- ─────────────────────────────────────────────────────────────────
-- Supabase: Dashboard → Authentication → Policies → RLS OFF (leave off)
-- or run:  ALTER TABLE public.* DISABLE ROW LEVEL SECURITY;  (default)
