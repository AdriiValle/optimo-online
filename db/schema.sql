CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'athlete');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sport AS ENUM ('football', 'running', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE match_venue AS ENUM ('casa', 'fuera');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE injury_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE integration_provider AS ENUM ('whoop');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE integration_status AS ENUM ('disconnected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  sport sport NOT NULL,
  photo_bytes bytea,
  photo_mime text,
  team text,
  shirt_number text,
  birth_date date,
  height_cm numeric,
  weight_kg numeric,
  diet_notes text,
  supplements jsonb NOT NULL DEFAULT '[]'::jsonb,
  sleep_routine text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS supplements jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS day_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL,
  md_tag text,
  title text,
  minutes integer,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  match_opponent text,
  match_venue match_venue,
  match_time text,
  match_competition text,
  UNIQUE (athlete_id, date)
);

CREATE TABLE IF NOT EXISTS diaries (
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL,
  sleep_hours numeric,
  sleep_quality integer,
  recovery integer,
  hrv numeric,
  resting_hr integer,
  rpe integer,
  feeling integer,
  km numeric,
  avg_hr integer,
  diet_note text,
  free_note text,
  PRIMARY KEY (athlete_id, date)
);

CREATE TABLE IF NOT EXISTS injuries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  zone text NOT NULL,
  status injury_status NOT NULL DEFAULT 'open',
  note text,
  started_on date NOT NULL,
  closed_on date
);

CREATE TABLE IF NOT EXISTS integrations (
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  status integration_status NOT NULL DEFAULT 'disconnected',
  PRIMARY KEY (athlete_id, provider)
);

CREATE INDEX IF NOT EXISTS day_plans_athlete_date_idx ON day_plans (athlete_id, date);
CREATE INDEX IF NOT EXISTS injuries_athlete_status_idx ON injuries (athlete_id, status);

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_role', true) = 'admin'
$$;

CREATE OR REPLACE FUNCTION app_athlete_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.athlete_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_account_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.account_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION lookup_account_by_email(p_email text)
RETURNS TABLE (id uuid, email text, password_hash text, role user_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT a.id, a.email, a.password_hash, a.role
  FROM accounts a
  WHERE a.email = lower(trim(p_email))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION set_own_password_hash(p_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  UPDATE accounts SET password_hash = p_hash WHERE id = app_account_id();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION set_own_account_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_norm text;
BEGIN
  v_norm := lower(trim(p_email));
  IF v_norm = '' OR length(v_norm) > 200 THEN
    RETURN false;
  END IF;
  UPDATE accounts SET email = v_norm WHERE id = app_account_id();
  RETURN FOUND;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END;
$$;

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes FORCE ROW LEVEL SECURITY;
ALTER TABLE day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaries FORCE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries FORCE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounts_select ON accounts;
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (app_is_admin() OR id = app_account_id());

DROP POLICY IF EXISTS accounts_write ON accounts;
CREATE POLICY accounts_write ON accounts FOR ALL
  USING (app_is_admin())
  WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS athletes_select ON athletes;
CREATE POLICY athletes_select ON athletes FOR SELECT
  USING (app_is_admin() OR id = app_athlete_id());

DROP POLICY IF EXISTS athletes_insert ON athletes;
CREATE POLICY athletes_insert ON athletes FOR INSERT
  WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS athletes_update ON athletes;
CREATE POLICY athletes_update ON athletes FOR UPDATE
  USING (app_is_admin() OR id = app_athlete_id())
  WITH CHECK (app_is_admin() OR id = app_athlete_id());

DROP POLICY IF EXISTS athletes_delete ON athletes;
CREATE POLICY athletes_delete ON athletes FOR DELETE
  USING (app_is_admin());

DROP POLICY IF EXISTS day_plans_select ON day_plans;
CREATE POLICY day_plans_select ON day_plans FOR SELECT
  USING (app_is_admin() OR athlete_id = app_athlete_id());

DROP POLICY IF EXISTS day_plans_write ON day_plans;
CREATE POLICY day_plans_write ON day_plans FOR ALL
  USING (app_is_admin())
  WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS diaries_all ON diaries;
CREATE POLICY diaries_all ON diaries
  USING (app_is_admin() OR athlete_id = app_athlete_id())
  WITH CHECK (app_is_admin() OR athlete_id = app_athlete_id());

DROP POLICY IF EXISTS injuries_select ON injuries;
CREATE POLICY injuries_select ON injuries FOR SELECT
  USING (app_is_admin() OR athlete_id = app_athlete_id());

DROP POLICY IF EXISTS injuries_write ON injuries;
CREATE POLICY injuries_write ON injuries FOR ALL
  USING (app_is_admin())
  WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS integrations_select ON integrations;
CREATE POLICY integrations_select ON integrations FOR SELECT
  USING (app_is_admin() OR athlete_id = app_athlete_id());

DROP POLICY IF EXISTS integrations_write ON integrations;
CREATE POLICY integrations_write ON integrations FOR ALL
  USING (app_is_admin())
  WITH CHECK (app_is_admin());
