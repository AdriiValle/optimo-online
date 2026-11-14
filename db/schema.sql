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
  WHERE a.email = trim(p_email)
     OR a.email = lower(trim(p_email))
  ORDER BY CASE WHEN a.email = trim(p_email) THEN 0 ELSE 1 END
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

-- Wearable integrations (additive). Enum values added here must not be used in this same script run.
ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'amazfit';
ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'polar';
ALTER TYPE integration_status ADD VALUE IF NOT EXISTS 'connected';
ALTER TYPE integration_status ADD VALUE IF NOT EXISTS 'error';

ALTER TABLE integrations ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS integration_tokens (
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  access_token_enc text NOT NULL,
  refresh_token_enc text NOT NULL DEFAULT '',
  token_expires_at timestamptz,
  external_user_id text,
  PRIMARY KEY (athlete_id, provider),
  FOREIGN KEY (athlete_id, provider) REFERENCES integrations (athlete_id, provider) ON DELETE CASCADE
);

ALTER TABLE diaries ADD COLUMN IF NOT EXISTS device_source integration_provider;
ALTER TABLE diaries ADD COLUMN IF NOT EXISTS device_synced_at timestamptz;

CREATE TABLE IF NOT EXISTS device_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL,
  provider integration_provider NOT NULL,
  external_id text NOT NULL,
  sport text,
  duration_seconds integer,
  calories integer,
  avg_hr integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, provider, external_id)
);

CREATE INDEX IF NOT EXISTS device_workouts_athlete_date_idx ON device_workouts (athlete_id, date);

ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE device_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_workouts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integrations_write_own ON integrations;
CREATE POLICY integrations_write_own ON integrations FOR INSERT
  WITH CHECK (athlete_id = app_athlete_id());
DROP POLICY IF EXISTS integrations_update_own ON integrations;
CREATE POLICY integrations_update_own ON integrations FOR UPDATE
  USING (athlete_id = app_athlete_id())
  WITH CHECK (athlete_id = app_athlete_id());

DROP POLICY IF EXISTS integration_tokens_all ON integration_tokens;
CREATE POLICY integration_tokens_all ON integration_tokens FOR ALL
  USING (app_is_admin() OR athlete_id = app_athlete_id())
  WITH CHECK (app_is_admin() OR athlete_id = app_athlete_id());

DROP POLICY IF EXISTS device_workouts_all ON device_workouts;
CREATE POLICY device_workouts_all ON device_workouts FOR ALL
  USING (app_is_admin() OR athlete_id = app_athlete_id())
  WITH CHECK (app_is_admin() OR athlete_id = app_athlete_id());

-- Nutricionista (additive). 'nutritionist' must not be used as user_role literal in this same script run.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'nutritionist';

CREATE TABLE IF NOT EXISTS nutritionist_athletes (
  nutritionist_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  PRIMARY KEY (nutritionist_account_id, athlete_id)
);

DO $$ BEGIN
  CREATE TYPE meal_slot_kind AS ENUM ('breakfast', 'lunch', 'dinner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE meal_slot_kind ADD VALUE IF NOT EXISTS 'morning_snack';
ALTER TYPE meal_slot_kind ADD VALUE IF NOT EXISTS 'afternoon_snack';

CREATE TABLE IF NOT EXISTS meal_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL,
  slot meal_slot_kind NOT NULL,
  title text NOT NULL DEFAULT '',
  preparation text,
  photo_bytes bytea,
  photo_mime text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, date, slot)
);

CREATE INDEX IF NOT EXISTS meal_slots_athlete_date_idx ON meal_slots (athlete_id, date);

CREATE OR REPLACE FUNCTION app_is_nutritionist() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_role', true) = 'nutritionist'
$$;

CREATE OR REPLACE FUNCTION app_nutritionist_assigned(p_athlete_id uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_is_nutritionist() AND EXISTS (
    SELECT 1 FROM nutritionist_athletes na
    WHERE na.nutritionist_account_id = app_account_id()
      AND na.athlete_id = p_athlete_id
  )
$$;

ALTER TABLE nutritionist_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionist_athletes FORCE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nutritionist_athletes_select ON nutritionist_athletes;
CREATE POLICY nutritionist_athletes_select ON nutritionist_athletes FOR SELECT
  USING (app_is_admin() OR (app_is_nutritionist() AND nutritionist_account_id = app_account_id()));

DROP POLICY IF EXISTS nutritionist_athletes_write ON nutritionist_athletes;
CREATE POLICY nutritionist_athletes_write ON nutritionist_athletes FOR ALL
  USING (app_is_admin())
  WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS athletes_select ON athletes;
CREATE POLICY athletes_select ON athletes FOR SELECT
  USING (app_is_admin() OR id = app_athlete_id() OR app_nutritionist_assigned(id));

DROP POLICY IF EXISTS day_plans_select ON day_plans;
CREATE POLICY day_plans_select ON day_plans FOR SELECT
  USING (app_is_admin() OR athlete_id = app_athlete_id() OR app_nutritionist_assigned(athlete_id));

DROP POLICY IF EXISTS meal_slots_select ON meal_slots;
CREATE POLICY meal_slots_select ON meal_slots FOR SELECT
  USING (app_is_admin() OR athlete_id = app_athlete_id() OR app_nutritionist_assigned(athlete_id));

DROP POLICY IF EXISTS meal_slots_insert ON meal_slots;
CREATE POLICY meal_slots_insert ON meal_slots FOR INSERT
  WITH CHECK (app_is_admin() OR app_nutritionist_assigned(athlete_id));

DROP POLICY IF EXISTS meal_slots_update ON meal_slots;
CREATE POLICY meal_slots_update ON meal_slots FOR UPDATE
  USING (app_is_admin() OR app_nutritionist_assigned(athlete_id))
  WITH CHECK (app_is_admin() OR app_nutritionist_assigned(athlete_id));

DROP POLICY IF EXISTS meal_slots_delete ON meal_slots;
CREATE POLICY meal_slots_delete ON meal_slots FOR DELETE
  USING (app_is_admin() OR app_nutritionist_assigned(athlete_id));

-- Nutricionista asignada edita solo diet_notes/supplements (athletes_update no se amplía).
CREATE OR REPLACE FUNCTION nutritionist_set_athlete_nutrition(p_athlete_id uuid, p_diet_notes text, p_supplements jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT app_nutritionist_assigned(p_athlete_id) THEN
    RETURN false;
  END IF;
  UPDATE athletes SET diet_notes = p_diet_notes, supplements = p_supplements WHERE id = p_athlete_id;
  RETURN FOUND;
END;
$$;

-- Nutricionista asignada edita la ficha física (nacimiento, altura, peso) del deportista.
CREATE OR REPLACE FUNCTION nutritionist_set_athlete_profile(p_athlete_id uuid, p_birth_date date, p_height_cm numeric, p_weight_kg numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT app_nutritionist_assigned(p_athlete_id) THEN
    RETURN false;
  END IF;
  UPDATE athletes SET birth_date = p_birth_date, height_cm = p_height_cm, weight_kg = p_weight_kg WHERE id = p_athlete_id;
  RETURN FOUND;
END;
$$;

-- Macros del menú (additive). Valores de foods por 100 g de porción comestible; null = desconocido, no 0.
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_es text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}',
  source text NOT NULL CHECK (source IN ('fdc', 'bedca', 'manual')),
  source_ref text,
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sodium_mg numeric,
  iron_mg numeric,
  calcium_mg numeric,
  vit_d_ug numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_slot_id uuid NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id),
  raw_text text NOT NULL,
  role text NOT NULL CHECK (role IN ('veg', 'protein', 'carb', 'fat', 'other')),
  grams numeric CHECK (grams >= 0),
  origin text NOT NULL CHECK (origin IN ('rule', 'manual', 'llm')),
  confirmed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS meal_items_slot_idx ON meal_items (meal_slot_id, position);

CREATE TABLE IF NOT EXISTS portion_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,
  day_type text NOT NULL CHECK (day_type IN ('rest', 'training', 'match')),
  slot meal_slot_kind NOT NULL,
  role text NOT NULL CHECK (role IN ('veg', 'protein', 'carb', 'fat', 'other')),
  grams numeric NOT NULL CHECK (grams >= 0),
  UNIQUE NULLS NOT DISTINCT (athlete_id, day_type, slot, role)
);

ALTER TABLE meal_slots ADD COLUMN IF NOT EXISTS items_text_hash text;
-- Hash del texto del plato con el que se generó cada item: si ya no coincide, el item queda obsoleto.
ALTER TABLE meal_items ADD COLUMN IF NOT EXISTS text_hash text;

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods FORCE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items FORCE ROW LEVEL SECURITY;
ALTER TABLE portion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE portion_templates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS foods_select ON foods;
CREATE POLICY foods_select ON foods FOR SELECT
  USING (true);

DROP POLICY IF EXISTS foods_write ON foods;
CREATE POLICY foods_write ON foods FOR ALL
  USING (app_is_admin() OR app_is_nutritionist())
  WITH CHECK (app_is_admin() OR app_is_nutritionist());

DROP POLICY IF EXISTS meal_items_select ON meal_items;
CREATE POLICY meal_items_select ON meal_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meal_slots ms
    WHERE ms.id = meal_items.meal_slot_id
      AND (app_is_admin() OR ms.athlete_id = app_athlete_id() OR app_nutritionist_assigned(ms.athlete_id))
  ));

DROP POLICY IF EXISTS meal_items_write ON meal_items;
CREATE POLICY meal_items_write ON meal_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM meal_slots ms
    WHERE ms.id = meal_items.meal_slot_id
      AND (app_is_admin() OR app_nutritionist_assigned(ms.athlete_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_slots ms
    WHERE ms.id = meal_items.meal_slot_id
      AND (app_is_admin() OR app_nutritionist_assigned(ms.athlete_id))
  ));

DROP POLICY IF EXISTS portion_templates_select ON portion_templates;
CREATE POLICY portion_templates_select ON portion_templates FOR SELECT
  USING (
    app_is_admin()
    OR athlete_id = app_athlete_id()
    OR (app_is_nutritionist() AND (athlete_id IS NULL OR app_nutritionist_assigned(athlete_id)))
  );

DROP POLICY IF EXISTS portion_templates_write ON portion_templates;
CREATE POLICY portion_templates_write ON portion_templates FOR ALL
  USING (app_is_admin() OR (app_is_nutritionist() AND (athlete_id IS NULL OR app_nutritionist_assigned(athlete_id))))
  WITH CHECK (app_is_admin() OR (app_is_nutritionist() AND (athlete_id IS NULL OR app_nutritionist_assigned(athlete_id))));

-- Pista N: nutrición (additive). Solo tablas/columnas nuevas; nada se borra ni cambia.
-- Alimentos: datos de la lista de la compra (pasillo y unidad de compra).
ALTER TABLE foods ADD COLUMN IF NOT EXISTS aisle text;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS unit_name text;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS unit_g numeric CHECK (unit_g > 0);
ALTER TABLE foods ADD COLUMN IF NOT EXISTS pack_g numeric CHECK (pack_g > 0);
ALTER TABLE foods ADD COLUMN IF NOT EXISTS staple boolean NOT NULL DEFAULT false;

-- Perfil nutricional del deportista (lo edita la nutricionista vía RPC, no el deportista).
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS allergies text[] NOT NULL DEFAULT '{}';
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS intolerances text[] NOT NULL DEFAULT '{}';
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS show_numbers boolean NOT NULL DEFAULT false;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS target_overrides jsonb;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS diet_goal text;

-- Lista de la compra: «ya lo tengo» por semana. food_key = foods.id o texto normalizado si no hay alimento.
CREATE TABLE IF NOT EXISTS shopping_checks (
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  food_key text NOT NULL CHECK (length(food_key) BETWEEN 1 AND 200),
  checked boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (athlete_id, week_start, food_key)
);

-- Check de comidas del deportista: uno por franja (done ✓ / half ½ / missed ✕).
CREATE TABLE IF NOT EXISTS meal_checks (
  meal_slot_id uuid PRIMARY KEY REFERENCES meal_slots(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('done', 'half', 'missed')),
  note text CHECK (note IS NULL OR length(note) <= 280),
  photo_bytes bytea,
  photo_mime text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((photo_bytes IS NULL) = (photo_mime IS NULL))
);

-- Peso y medidas (seguimiento de la nutricionista). El peso del perfil = último registro.
CREATE TABLE IF NOT EXISTS body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight_kg numeric CHECK (weight_kg > 0),
  body_fat_pct numeric CHECK (body_fat_pct >= 0 AND body_fat_pct <= 100),
  skinfold_sum_mm numeric CHECK (skinfold_sum_mm >= 0),
  waist_cm numeric CHECK (waist_cm > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, date)
);

-- Plantillas de menú globales (día o semana; md_tag p. ej. MD-1, MD, MD+1).
CREATE TABLE IF NOT EXISTS menu_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  kind text NOT NULL CHECK (kind IN ('day', 'week')),
  md_tag text,
  notes text,
  created_by uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Franjas de una plantilla: day_offset 0 en plantillas de día; 0..6 (lunes..domingo) en las de semana.
CREATE TABLE IF NOT EXISTS menu_template_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES menu_templates(id) ON DELETE CASCADE,
  day_offset integer NOT NULL DEFAULT 0 CHECK (day_offset BETWEEN 0 AND 6),
  slot meal_slot_kind NOT NULL,
  title text NOT NULL DEFAULT '',
  preparation text,
  photo_bytes bytea,
  photo_mime text,
  UNIQUE (template_id, day_offset, slot)
);

CREATE TABLE IF NOT EXISTS menu_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slot_id uuid NOT NULL REFERENCES menu_template_slots(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id),
  raw_text text NOT NULL,
  role text NOT NULL CHECK (role IN ('veg', 'protein', 'carb', 'fat', 'other')),
  grams numeric CHECK (grams >= 0),
  position integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS menu_template_items_slot_idx ON menu_template_items (template_slot_id, position);

-- Biblioteca de platos global («buscar en mis platos»). slot = franja sugerida, opcional.
CREATE TABLE IF NOT EXISTS dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  slot meal_slot_kind,
  preparation text,
  photo_bytes bytea,
  photo_mime text,
  created_by uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dishes_name_idx ON dishes (lower(name));

CREATE TABLE IF NOT EXISTS dish_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id),
  raw_text text NOT NULL,
  role text NOT NULL CHECK (role IN ('veg', 'protein', 'carb', 'fat', 'other')),
  grams numeric CHECK (grams >= 0),
  position integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS dish_items_dish_idx ON dish_items (dish_id, position);

-- Sustituciones aprobadas: gramos de swap_food = gramos de food × ratio.
CREATE TABLE IF NOT EXISTS food_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  swap_food_id uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  ratio numeric NOT NULL DEFAULT 1 CHECK (ratio > 0),
  approved_by uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (food_id, swap_food_id),
  CHECK (food_id <> swap_food_id)
);

-- Nota de la nutricionista por día.
CREATE TABLE IF NOT EXISTS meal_day_notes (
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL,
  note text NOT NULL CHECK (length(note) <= 2000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (athlete_id, date)
);

ALTER TABLE shopping_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_checks FORCE ROW LEVEL SECURITY;
ALTER TABLE meal_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_checks FORCE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements FORCE ROW LEVEL SECURITY;
ALTER TABLE menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE menu_template_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_template_slots FORCE ROW LEVEL SECURITY;
ALTER TABLE menu_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_template_items FORCE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes FORCE ROW LEVEL SECURITY;
ALTER TABLE dish_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_items FORCE ROW LEVEL SECURITY;
ALTER TABLE food_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_swaps FORCE ROW LEVEL SECURITY;
ALTER TABLE meal_day_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_day_notes FORCE ROW LEVEL SECURITY;

-- shopping_checks: admin, deportista dueño y nutricionista asignada leen y escriben.
DROP POLICY IF EXISTS shopping_checks_all ON shopping_checks;
CREATE POLICY shopping_checks_all ON shopping_checks FOR ALL
  USING (app_is_admin() OR athlete_id = app_athlete_id() OR app_nutritionist_assigned(athlete_id))
  WITH CHECK (app_is_admin() OR athlete_id = app_athlete_id() OR app_nutritionist_assigned(athlete_id));

-- meal_checks: igual, a través de la franja (meal_slots) a la que pertenece.
DROP POLICY IF EXISTS meal_checks_all ON meal_checks;
CREATE POLICY meal_checks_all ON meal_checks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM meal_slots ms
    WHERE ms.id = meal_checks.meal_slot_id
      AND (app_is_admin() OR ms.athlete_id = app_athlete_id() OR app_nutritionist_assigned(ms.athlete_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_slots ms
    WHERE ms.id = meal_checks.meal_slot_id
      AND (app_is_admin() OR ms.athlete_id = app_athlete_id() OR app_nutritionist_assigned(ms.athlete_id))
  ));

-- body_measurements y meal_day_notes: el deportista solo lee lo suyo; escriben admin y nutricionista asignada.
DROP POLICY IF EXISTS body_measurements_select ON body_measurements;
CREATE POLICY body_measurements_select ON body_measurements FOR SELECT
  USING (app_is_admin() OR athlete_id = app_athlete_id() OR app_nutritionist_assigned(athlete_id));

DROP POLICY IF EXISTS body_measurements_write ON body_measurements;
CREATE POLICY body_measurements_write ON body_measurements FOR ALL
  USING (app_is_admin() OR app_nutritionist_assigned(athlete_id))
  WITH CHECK (app_is_admin() OR app_nutritionist_assigned(athlete_id));

DROP POLICY IF EXISTS meal_day_notes_select ON meal_day_notes;
CREATE POLICY meal_day_notes_select ON meal_day_notes FOR SELECT
  USING (app_is_admin() OR athlete_id = app_athlete_id() OR app_nutritionist_assigned(athlete_id));

DROP POLICY IF EXISTS meal_day_notes_write ON meal_day_notes;
CREATE POLICY meal_day_notes_write ON meal_day_notes FOR ALL
  USING (app_is_admin() OR app_nutritionist_assigned(athlete_id))
  WITH CHECK (app_is_admin() OR app_nutritionist_assigned(athlete_id));

-- Catálogos globales del panel (plantillas y platos): solo admin y nutricionista.
DROP POLICY IF EXISTS menu_templates_all ON menu_templates;
CREATE POLICY menu_templates_all ON menu_templates FOR ALL
  USING (app_is_admin() OR app_is_nutritionist())
  WITH CHECK (app_is_admin() OR app_is_nutritionist());

DROP POLICY IF EXISTS menu_template_slots_all ON menu_template_slots;
CREATE POLICY menu_template_slots_all ON menu_template_slots FOR ALL
  USING (app_is_admin() OR app_is_nutritionist())
  WITH CHECK (app_is_admin() OR app_is_nutritionist());

DROP POLICY IF EXISTS menu_template_items_all ON menu_template_items;
CREATE POLICY menu_template_items_all ON menu_template_items FOR ALL
  USING (app_is_admin() OR app_is_nutritionist())
  WITH CHECK (app_is_admin() OR app_is_nutritionist());

DROP POLICY IF EXISTS dishes_all ON dishes;
CREATE POLICY dishes_all ON dishes FOR ALL
  USING (app_is_admin() OR app_is_nutritionist())
  WITH CHECK (app_is_admin() OR app_is_nutritionist());

DROP POLICY IF EXISTS dish_items_all ON dish_items;
CREATE POLICY dish_items_all ON dish_items FOR ALL
  USING (app_is_admin() OR app_is_nutritionist())
  WITH CHECK (app_is_admin() OR app_is_nutritionist());

-- food_swaps: catálogo global como foods (lo leen todos; escriben admin y nutricionista).
DROP POLICY IF EXISTS food_swaps_select ON food_swaps;
CREATE POLICY food_swaps_select ON food_swaps FOR SELECT
  USING (true);

DROP POLICY IF EXISTS food_swaps_write ON food_swaps;
CREATE POLICY food_swaps_write ON food_swaps FOR ALL
  USING (app_is_admin() OR app_is_nutritionist())
  WITH CHECK (app_is_admin() OR app_is_nutritionist());

-- El deportista puede actualizar su fila (athletes_update), pero no los campos que fija la nutricionista.
CREATE OR REPLACE FUNCTION athletes_keep_nutrition_fields() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('app.current_role', true) = 'athlete' THEN
    NEW.allergies := OLD.allergies;
    NEW.intolerances := OLD.intolerances;
    NEW.show_numbers := OLD.show_numbers;
    NEW.target_overrides := OLD.target_overrides;
    NEW.diet_goal := OLD.diet_goal;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER athletes_keep_nutrition_fields
  BEFORE UPDATE ON athletes
  FOR EACH ROW EXECUTE FUNCTION athletes_keep_nutrition_fields();

-- Función aparte: no se toca nutritionist_set_athlete_profile (lib/queries.ts la llama con 4 argumentos;
-- añadirle parámetros con DEFAULT crearía una sobrecarga y esa llamada pasaría a ser ambigua).
CREATE OR REPLACE FUNCTION nutritionist_set_athlete_diet_profile(
  p_athlete_id uuid,
  p_allergies text[],
  p_intolerances text[],
  p_show_numbers boolean,
  p_target_overrides jsonb,
  p_diet_goal text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT (app_is_admin() OR app_nutritionist_assigned(p_athlete_id)) THEN
    RETURN false;
  END IF;
  IF p_target_overrides IS NOT NULL AND jsonb_typeof(p_target_overrides) <> 'object' THEN
    RETURN false;
  END IF;
  UPDATE athletes SET
    allergies = COALESCE(p_allergies, '{}'),
    intolerances = COALESCE(p_intolerances, '{}'),
    show_numbers = COALESCE(p_show_numbers, false),
    target_overrides = p_target_overrides,
    diet_goal = NULLIF(trim(p_diet_goal), '')
  WHERE id = p_athlete_id;
  RETURN FOUND;
END;
$$;
