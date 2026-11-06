import type { Tx } from "@/lib/db";
import type {
  Athlete,
  DayPlan,
  Diary,
  Injury,
  IntegrationInfo,
  MealSlot,
  MealSlotKind,
  SessionUser,
  Sport,
  SupplementEntry
} from "@/lib/types";
import { isoDate } from "@/lib/dates";

type AccountRow = { id: string; email: string; password_hash: string; role: SessionUser["role"] };
type AthleteRow = {
  id: string;
  account_id: string;
  name: string;
  sport: Sport;
  has_photo: boolean;
  team: string | null;
  shirt_number: string | null;
  diet_notes: string | null;
  supplements: SupplementEntry[] | null;
  sleep_routine: string | null;
};

function mapSupplements(raw: SupplementEntry[] | null | undefined): SupplementEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s.name === "string" && typeof s.time === "string")
    .map((s) => ({
      name: s.name.trim(),
      time: s.time.trim(),
      notes: s.notes?.trim() || null
    }))
    .filter((s) => s.name && s.time);
}

function mapAthlete(row: AthleteRow): Athlete {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    sport: row.sport,
    hasPhoto: row.has_photo,
    team: row.team,
    shirtNumber: row.shirt_number,
    dietNotes: row.diet_notes,
    supplements: mapSupplements(row.supplements),
    sleepRoutine: row.sleep_routine
  };
}

export async function lookupAccountByEmail(tx: Tx, email: string) {
  const rows = await tx<AccountRow[]>`select * from lookup_account_by_email(${email})`;
  return rows[0] ?? null;
}

export async function athleteByAccountId(tx: Tx, accountId: string) {
  const rows = await tx<AthleteRow[]>`
    select id, account_id, name, sport,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      team, shirt_number, diet_notes, supplements, sleep_routine
    from athletes
    where account_id = ${accountId}
    limit 1
  `;
  return rows[0] ? mapAthlete(rows[0]) : null;
}

export async function athleteById(tx: Tx, id: string) {
  const rows = await tx<AthleteRow[]>`
    select id, account_id, name, sport,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      team, shirt_number, diet_notes, supplements, sleep_routine
    from athletes
    where id = ${id}
    limit 1
  `;
  return rows[0] ? mapAthlete(rows[0]) : null;
}

export async function listAthletes(tx: Tx) {
  const rows = await tx<AthleteRow[]>`
    select id, account_id, name, sport,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      team, shirt_number, diet_notes, supplements, sleep_routine
    from athletes
    order by name
  `;
  return rows.map(mapAthlete);
}

export type AdminAthleteAccount = {
  athleteId: string;
  accountId: string;
  email: string;
  name: string;
  hasPhoto: boolean;
};

export async function adminAthleteAccounts(tx: Tx): Promise<AdminAthleteAccount[]> {
  const rows = await tx<
    { athlete_id: string; account_id: string; email: string; name: string; has_photo: boolean }[]
  >`
    select a.id as athlete_id, a.account_id, c.email, a.name,
      (a.photo_bytes is not null and octet_length(a.photo_bytes) > 0) as has_photo
    from athletes a
    inner join accounts c on c.id = a.account_id
    order by a.name
  `;
  return rows.map((r) => ({
    athleteId: r.athlete_id,
    accountId: r.account_id,
    email: r.email,
    name: r.name,
    hasPhoto: r.has_photo
  }));
}

export async function accountById(tx: Tx, accountId: string) {
  const rows = await tx<Pick<AccountRow, "id" | "email" | "password_hash" | "role">[]>`
    select id, email, password_hash, role from accounts where id = ${accountId} limit 1
  `;
  return rows[0] ?? null;
}

export async function updateAthleteName(tx: Tx, athleteId: string, name: string) {
  await tx`update athletes set name = ${name} where id = ${athleteId}`;
}

export async function setOwnPasswordHash(tx: Tx, passwordHash: string) {
  const rows = await tx<{ ok: boolean }[]>`select set_own_password_hash(${passwordHash}) as ok`;
  return rows[0]?.ok ?? false;
}

export async function setAccountPasswordHash(tx: Tx, accountId: string, passwordHash: string) {
  await tx`update accounts set password_hash = ${passwordHash} where id = ${accountId}`;
}

export async function accountEmailTaken(tx: Tx, email: string, excludeAccountId?: string) {
  if (excludeAccountId) {
    const rows = await tx<{ id: string }[]>`
      select id from accounts where email = ${email} and id <> ${excludeAccountId} limit 1
    `;
    return Boolean(rows[0]);
  }
  const rows = await tx<{ id: string }[]>`
    select id from accounts where email = ${email} limit 1
  `;
  return Boolean(rows[0]);
}

export async function setOwnAccountEmail(tx: Tx, email: string) {
  const rows = await tx<{ ok: boolean }[]>`select set_own_account_email(${email}) as ok`;
  return rows[0]?.ok ?? false;
}

export async function setAccountEmail(tx: Tx, accountId: string, email: string) {
  const rows = await tx<{ id: string }[]>`
    update accounts set email = ${email} where id = ${accountId} returning id
  `;
  return Boolean(rows[0]);
}

export async function dayPlansForAthlete(tx: Tx, athleteId: string) {
  const rows = await tx<{
    date: string;
    md_tag: string | null;
    title: string | null;
    minutes: number | null;
    blocks: DayPlan["blocks"];
    match_opponent: string | null;
    match_venue: DayPlan["matchVenue"];
    match_time: string | null;
    match_competition: string | null;
  }[]>`
    select date::text, md_tag, title, minutes, blocks, match_opponent, match_venue, match_time, match_competition
    from day_plans
    where athlete_id = ${athleteId}
    order by date
  `;
  return rows.map(
    (r): DayPlan => ({
      date: isoDate(r.date),
      mdTag: r.md_tag,
      title: r.title,
      minutes: r.minutes,
      blocks: r.blocks ?? [],
      matchOpponent: r.match_opponent,
      matchVenue: r.match_venue,
      matchTime: r.match_time,
      matchCompetition: r.match_competition
    })
  );
}

export async function diaryFor(tx: Tx, athleteId: string, date: string) {
  const rows = await tx<{
    athlete_id: string;
    date: string;
    sleep_hours: string | number | null;
    sleep_quality: number | null;
    recovery: number | null;
    hrv: string | number | null;
    resting_hr: number | null;
    rpe: number | null;
    feeling: number | null;
    km: string | number | null;
    avg_hr: number | null;
    diet_note: string | null;
    free_note: string | null;
    device_source: Diary["deviceSource"] | null;
    device_synced_at: string | null;
  }[]>`
    select athlete_id, date::text, sleep_hours, sleep_quality, recovery, hrv, resting_hr, rpe, feeling, km, avg_hr, diet_note, free_note, device_source, device_synced_at::text
    from diaries
    where athlete_id = ${athleteId} and date = ${date}::date
    limit 1
  `;
  const r = rows[0];
  if (!r) return null;
  const num = (v: string | number | null) => (v === null || v === undefined ? null : Number(v));
  return {
    athleteId: r.athlete_id,
    date: isoDate(r.date),
    sleepHours: num(r.sleep_hours),
    sleepQuality: r.sleep_quality,
    recovery: r.recovery,
    hrv: num(r.hrv),
    restingHr: r.resting_hr,
    rpe: r.rpe,
    feeling: r.feeling,
    km: num(r.km),
    avgHr: r.avg_hr,
    dietNote: r.diet_note, // molestias (UI deportista); columna legacy diet_note
    freeNote: r.free_note,
    deviceSource: r.device_source ?? null,
    deviceSyncedAt: r.device_synced_at
  } satisfies Diary;
}

export async function diaryHistory(tx: Tx, athleteId: string, from: string, to: string): Promise<Diary[]> {
  const rows = await tx<{
    athlete_id: string;
    date: string;
    sleep_hours: string | number | null;
    sleep_quality: number | null;
    recovery: number | null;
    hrv: string | number | null;
    resting_hr: number | null;
    rpe: number | null;
    feeling: number | null;
    km: string | number | null;
    avg_hr: number | null;
    diet_note: string | null;
    free_note: string | null;
    device_source: Diary["deviceSource"] | null;
    device_synced_at: string | null;
  }[]>`
    select athlete_id, date::text, sleep_hours, sleep_quality, recovery, hrv, resting_hr, rpe, feeling, km, avg_hr, diet_note, free_note, device_source, device_synced_at::text
    from diaries
    where athlete_id = ${athleteId} and date between ${from}::date and ${to}::date
    order by date asc
  `;
  const num = (v: string | number | null) => (v === null || v === undefined ? null : Number(v));
  return rows.map(
    (r): Diary => ({
      athleteId: r.athlete_id,
      date: isoDate(r.date),
      sleepHours: num(r.sleep_hours),
      sleepQuality: r.sleep_quality,
      recovery: r.recovery,
      hrv: num(r.hrv),
      restingHr: r.resting_hr,
      rpe: r.rpe,
      feeling: r.feeling,
      km: num(r.km),
      avgHr: r.avg_hr,
      dietNote: r.diet_note,
      freeNote: r.free_note,
      deviceSource: r.device_source ?? null,
      deviceSyncedAt: r.device_synced_at
    })
  );
}

export async function openInjuries(tx: Tx, athleteId: string) {
  const rows = await tx<{
    id: string;
    zone: string;
    status: "open" | "closed";
    note: string | null;
    started_on: string;
    closed_on: string | null;
  }[]>`
    select id, zone, status, note, started_on::text, closed_on::text
    from injuries
    where athlete_id = ${athleteId} and status = 'open'
    order by started_on desc
  `;
  return rows.map(
    (r): Injury => ({
      id: r.id,
      zone: r.zone,
      status: r.status,
      note: r.note,
      startedOn: isoDate(r.started_on),
      closedOn: r.closed_on ? isoDate(r.closed_on) : null
    })
  );
}

export async function dayBlocks(tx: Tx, athleteId: string, date: string) {
  const rows = await tx<{ blocks: DayPlan["blocks"] }[]>`
    select blocks from day_plans
    where athlete_id = ${athleteId} and date = ${date}::date
    limit 1
  `;
  return rows[0]?.blocks ?? [];
}

type PlanJson = {
  date: string;
  md_tag: string | null;
  title: string | null;
  minutes: number | null;
  blocks: DayPlan["blocks"];
  match_opponent: string | null;
  match_venue: DayPlan["matchVenue"];
  match_time: string | null;
  match_competition: string | null;
};

type DiaryJson = {
  athlete_id: string;
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  recovery: number | null;
  hrv: number | null;
  resting_hr: number | null;
  rpe: number | null;
  feeling: number | null;
  km: number | null;
  avg_hr: number | null;
  diet_note: string | null;
  free_note: string | null;
  device_source?: Diary["deviceSource"] | null;
  device_synced_at?: string | null;
};

type IntegrationJson = {
  provider: IntegrationInfo["provider"];
  status: IntegrationInfo["status"];
  last_sync_at: string | null;
  last_error: string | null;
};

type InjuryJson = {
  id: string;
  zone: string;
  status: "open" | "closed";
  note: string | null;
  started_on: string;
  closed_on: string | null;
};

function mapPlan(p: PlanJson): DayPlan {
  return {
    date: isoDate(p.date),
    mdTag: p.md_tag,
    title: p.title,
    minutes: p.minutes,
    blocks: p.blocks ?? [],
    matchOpponent: p.match_opponent,
    matchVenue: p.match_venue,
    matchTime: p.match_time,
    matchCompetition: p.match_competition
  };
}

function mapDiaryJson(r: DiaryJson): Diary {
  const num = (v: number | null) => (v === null || v === undefined ? null : Number(v));
  return {
    athleteId: r.athlete_id,
    date: isoDate(r.date),
    sleepHours: num(r.sleep_hours),
    sleepQuality: r.sleep_quality,
    recovery: r.recovery,
    hrv: num(r.hrv),
    restingHr: r.resting_hr,
    rpe: r.rpe,
    feeling: r.feeling,
    km: num(r.km),
    avgHr: r.avg_hr,
    dietNote: r.diet_note, // molestias (UI deportista); columna legacy diet_note
    freeNote: r.free_note,
    deviceSource: r.device_source ?? null,
    deviceSyncedAt: r.device_synced_at ?? null
  };
}

function mapIntegrationJson(r: IntegrationJson | null): IntegrationInfo {
  if (!r) {
    return { provider: "polar", status: "disconnected", lastSyncAt: null, lastError: null };
  }
  return {
    provider: r.provider,
    status: r.status,
    lastSyncAt: r.last_sync_at,
    lastError: r.last_error
  };
}

export async function integrationFor(tx: Tx, athleteId: string): Promise<IntegrationInfo | null> {
  const rows = await tx<
    { provider: IntegrationInfo["provider"]; status: IntegrationInfo["status"]; last_sync_at: string | null; last_error: string | null }[]
  >`
    select provider, status, last_sync_at::text, last_error
    from integrations
    where athlete_id = ${athleteId} and status <> 'disconnected'
    order by updated_at desc nulls last
    limit 1
  `;
  const r = rows[0];
  if (!r) return null;
  return {
    provider: r.provider,
    status: r.status,
    lastSyncAt: r.last_sync_at,
    lastError: r.last_error
  };
}

function mapInjuryJson(r: InjuryJson): Injury {
  return {
    id: r.id,
    zone: r.zone,
    status: r.status,
    note: r.note,
    startedOn: isoDate(r.started_on),
    closedOn: r.closed_on ? isoDate(r.closed_on) : null
  };
}

export async function athleteHome(tx: Tx, athleteId: string, date: string) {
  const rows = await tx<
    {
      athlete: AthleteRow | null;
      plans: PlanJson[] | null;
      focus_blocks: DayPlan["blocks"] | null;
      diary: DiaryJson | null;
      injuries: InjuryJson[] | null;
      polar_integration: IntegrationJson | null;
    }[]
  >`
    select
      (
        select jsonb_build_object(
          'id', a.id,
          'account_id', a.account_id,
          'name', a.name,
          'sport', a.sport,
          'has_photo', (a.photo_bytes is not null and octet_length(a.photo_bytes) > 0),
          'team', a.team,
          'shirt_number', a.shirt_number,
          'diet_notes', a.diet_notes,
          'supplements', coalesce(a.supplements, '[]'::jsonb),
          'sleep_routine', a.sleep_routine
        )
        from athletes a
        where a.id = ${athleteId}
      ) as athlete,
      (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'date', p.date::text,
            'md_tag', p.md_tag,
            'title', p.title,
            'minutes', p.minutes,
            'match_opponent', p.match_opponent,
            'match_venue', p.match_venue,
            'match_time', p.match_time,
            'match_competition', p.match_competition
          )
          order by p.date
        ), '[]'::jsonb)
        from day_plans p
        where p.athlete_id = ${athleteId}
      ) as plans,
      (
        select p.blocks
        from day_plans p
        where p.athlete_id = ${athleteId} and p.date = ${date}::date
      ) as focus_blocks,
      (
        select jsonb_build_object(
          'athlete_id', d.athlete_id,
          'date', d.date::text,
          'sleep_hours', d.sleep_hours,
          'sleep_quality', d.sleep_quality,
          'recovery', d.recovery,
          'hrv', d.hrv,
          'resting_hr', d.resting_hr,
          'rpe', d.rpe,
          'feeling', d.feeling,
          'km', d.km,
          'avg_hr', d.avg_hr,
          'diet_note', d.diet_note,
          'free_note', d.free_note,
          'device_source', d.device_source,
          'device_synced_at', d.device_synced_at
        )
        from diaries d
        where d.athlete_id = ${athleteId} and d.date = ${date}::date
      ) as diary,
      (
        select jsonb_build_object(
          'provider', i.provider,
          'status', i.status,
          'last_sync_at', i.last_sync_at::text,
          'last_error', i.last_error
        )
        from integrations i
        where i.athlete_id = ${athleteId} and i.provider = 'polar'
      ) as polar_integration,
      (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', i.id,
            'zone', i.zone,
            'status', i.status,
            'note', i.note,
            'started_on', i.started_on::text,
            'closed_on', i.closed_on::text
          )
          order by i.started_on desc
        ), '[]'::jsonb)
        from injuries i
        where i.athlete_id = ${athleteId} and i.status = 'open'
      ) as injuries
  `;
  const row = rows[0];
  if (!row?.athlete) return null;
  return {
    athlete: mapAthlete(row.athlete),
    plans: (row.plans ?? []).map((p) =>
      mapPlan({
        ...p,
        blocks: isoDate(p.date) === date ? (row.focus_blocks ?? []) : []
      })
    ),
    diary: row.diary ? mapDiaryJson(row.diary) : null,
    injuries: (row.injuries ?? []).map(mapInjuryJson),
    polarIntegration: mapIntegrationJson(row.polar_integration)
  };
}

export async function panelCards(tx: Tx, date: string) {
  const rows = await tx<
    (AthleteRow & {
      recovery: number | null;
      injury_id: string | null;
      injury_zone: string | null;
      injury_status: "open" | "closed" | null;
      injury_note: string | null;
      injury_started_on: string | null;
      injury_closed_on: string | null;
    })[]
  >`
    select
      a.id, a.account_id, a.name, a.sport,
      (a.photo_bytes is not null and octet_length(a.photo_bytes) > 0) as has_photo,
      a.team, a.shirt_number, a.diet_notes, a.supplements, a.sleep_routine,
      d.recovery,
      i.id as injury_id,
      i.zone as injury_zone,
      i.status as injury_status,
      i.note as injury_note,
      i.started_on::text as injury_started_on,
      i.closed_on::text as injury_closed_on
    from athletes a
    left join diaries d on d.athlete_id = a.id and d.date = ${date}::date
    left join lateral (
      select id, zone, status, note, started_on, closed_on
      from injuries
      where athlete_id = a.id and status = 'open'
      order by started_on desc
      limit 1
    ) i on true
    order by a.name
  `;
  return rows.map((row) => ({
    ...mapAthlete(row),
    recovery: row.recovery,
    injury: row.injury_id
      ? ({
          id: row.injury_id,
          zone: row.injury_zone ?? "",
          status: row.injury_status ?? "open",
          note: row.injury_note,
          startedOn: isoDate(row.injury_started_on ?? date),
          closedOn: row.injury_closed_on ? isoDate(row.injury_closed_on) : null
        } satisfies Injury)
      : null
  }));
}

export async function updateAthleteNutrition(
  tx: Tx,
  athleteId: string,
  dietNotes: string | null,
  supplements: SupplementEntry[]
) {
  const rows = await tx<AthleteRow[]>`
    update athletes
    set
      diet_notes = ${dietNotes},
      supplements = ${tx.json(supplements)}
    where id = ${athleteId}
    returning
      id, account_id, name, sport,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      team, shirt_number, diet_notes, supplements, sleep_routine
  `;
  return rows[0] ? mapAthlete(rows[0]) : null;
}

export async function photoFor(tx: Tx, athleteId: string) {
  const rows = await tx<{ photo_bytes: Buffer | Uint8Array | null; photo_mime: string | null }[]>`
    select photo_bytes, photo_mime from athletes where id = ${athleteId} limit 1
  `;
  const row = rows[0];
  if (!row?.photo_bytes || !row.photo_bytes.length) return null;
  return { bytes: Buffer.from(row.photo_bytes), mime: row.photo_mime || "image/jpeg" };
}

export async function setAthleteNutritionAsNutritionist(
  tx: Tx,
  athleteId: string,
  dietNotes: string | null,
  supplements: SupplementEntry[]
) {
  const rows = await tx<{ ok: boolean }[]>`
    select nutritionist_set_athlete_nutrition(${athleteId}, ${dietNotes}, ${tx.json(supplements)}) as ok
  `;
  return rows[0]?.ok ?? false;
}

export type NutritionistAccount = {
  accountId: string;
  email: string;
  athleteIds: string[];
};

export async function nutritionistsList(tx: Tx): Promise<NutritionistAccount[]> {
  const rows = await tx<{ id: string; email: string; athlete_ids: string[] | null }[]>`
    select c.id, c.email,
      coalesce(array_agg(na.athlete_id) filter (where na.athlete_id is not null), '{}') as athlete_ids
    from accounts c
    left join nutritionist_athletes na on na.nutritionist_account_id = c.id
    where c.role::text = 'nutritionist'
    group by c.id, c.email
    order by c.email
  `;
  return rows.map((r) => ({ accountId: r.id, email: r.email, athleteIds: r.athlete_ids ?? [] }));
}

export async function createNutritionistAccount(tx: Tx, email: string, passwordHash: string) {
  const rows = await tx<{ id: string; email: string }[]>`
    insert into accounts (email, password_hash, role)
    values (${email}, ${passwordHash}, 'nutritionist')
    returning id, email
  `;
  return rows[0];
}

export async function setNutritionistAssignments(tx: Tx, accountId: string, athleteIds: string[]) {
  const found = await tx<{ id: string }[]>`
    select id from accounts where id = ${accountId} and role::text = 'nutritionist' limit 1
  `;
  if (!found[0]) return false;
  await tx`delete from nutritionist_athletes where nutritionist_account_id = ${accountId}`;
  if (athleteIds.length) {
    await tx`
      insert into nutritionist_athletes (nutritionist_account_id, athlete_id)
      select ${accountId}, a.id from athletes a where a.id = any(${athleteIds}::uuid[])
    `;
  }
  return true;
}

export type NutritionistAthleteCard = {
  id: string;
  name: string;
  sport: Sport;
  hasPhoto: boolean;
  team: string | null;
  shirtNumber: string | null;
};

/** Con RLS de nutricionista, `athletes` solo devuelve los asignados. */
export async function assignedAthletesForNutritionist(tx: Tx, accountId: string): Promise<NutritionistAthleteCard[]> {
  const rows = await tx<
    { id: string; name: string; sport: Sport; has_photo: boolean; team: string | null; shirt_number: string | null }[]
  >`
    select a.id, a.name, a.sport,
      (a.photo_bytes is not null and octet_length(a.photo_bytes) > 0) as has_photo,
      a.team, a.shirt_number
    from athletes a
    inner join nutritionist_athletes na on na.athlete_id = a.id
    where na.nutritionist_account_id = ${accountId}
    order by a.name
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sport: r.sport,
    hasPhoto: r.has_photo,
    team: r.team,
    shirtNumber: r.shirt_number
  }));
}

export async function isNutritionistAssigned(tx: Tx, athleteId: string) {
  const rows = await tx<{ ok: boolean }[]>`select app_nutritionist_assigned(${athleteId}) as ok`;
  return rows[0]?.ok ?? false;
}

/** Calendario sin bloques de sesión (vista nutricionista; RLS filtra asignados). */
export async function calendarPlansForAthlete(tx: Tx, athleteId: string): Promise<DayPlan[]> {
  const rows = await tx<PlanJson[]>`
    select date::text, md_tag, title, minutes, '[]'::jsonb as blocks,
      match_opponent, match_venue, match_time, match_competition
    from day_plans
    where athlete_id = ${athleteId}
    order by date
  `;
  return rows.map(mapPlan);
}

type MealRow = {
  id: string;
  athlete_id: string;
  date: string;
  slot: MealSlotKind;
  title: string;
  preparation: string | null;
  has_photo: boolean;
  updated_at: string;
};

function mapMeal(r: MealRow): MealSlot {
  return {
    id: r.id,
    athleteId: r.athlete_id,
    date: isoDate(r.date),
    slot: r.slot,
    title: r.title,
    preparation: r.preparation,
    hasPhoto: r.has_photo,
    updatedAt: r.updated_at
  };
}

export async function mealsForAthleteRange(tx: Tx, athleteId: string, from: string, to: string) {
  const rows = await tx<MealRow[]>`
    select id, athlete_id, date::text, slot, title, preparation,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      updated_at::text
    from meal_slots
    where athlete_id = ${athleteId} and date between ${from}::date and ${to}::date
    order by date, slot
  `;
  return rows.map(mapMeal);
}

export async function upsertMealSlot(
  tx: Tx,
  athleteId: string,
  date: string,
  slot: MealSlotKind,
  title: string,
  preparation: string | null
) {
  const rows = await tx<MealRow[]>`
    insert into meal_slots (athlete_id, date, slot, title, preparation)
    values (${athleteId}, ${date}::date, ${slot}, ${title}, ${preparation})
    on conflict (athlete_id, date, slot) do update set
      title = excluded.title, preparation = excluded.preparation, updated_at = now()
    returning id, athlete_id, date::text, slot, title, preparation,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      updated_at::text
  `;
  return rows[0] ? mapMeal(rows[0]) : null;
}

export async function mealById(tx: Tx, mealId: string) {
  const rows = await tx<MealRow[]>`
    select id, athlete_id, date::text, slot, title, preparation,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      updated_at::text
    from meal_slots
    where id = ${mealId}
    limit 1
  `;
  return rows[0] ? mapMeal(rows[0]) : null;
}

export async function deleteMealSlot(tx: Tx, mealId: string) {
  const rows = await tx<{ id: string }[]>`delete from meal_slots where id = ${mealId} returning id`;
  return Boolean(rows[0]);
}

export async function mealPhotoFor(tx: Tx, mealId: string) {
  const rows = await tx<{ photo_bytes: Buffer | Uint8Array | null; photo_mime: string | null }[]>`
    select photo_bytes, photo_mime from meal_slots where id = ${mealId} limit 1
  `;
  const row = rows[0];
  if (!row?.photo_bytes || !row.photo_bytes.length) return null;
  return { bytes: Buffer.from(row.photo_bytes), mime: row.photo_mime || "image/jpeg" };
}

export async function setMealPhoto(tx: Tx, mealId: string, bytes: Buffer, mime: string) {
  const rows = await tx<{ id: string }[]>`
    update meal_slots set photo_bytes = ${bytes}, photo_mime = ${mime}, updated_at = now()
    where id = ${mealId}
    returning id
  `;
  return Boolean(rows[0]);
}

// Macros del menú: borradores de ingredientes (meal_items).

type FoodForDraftRow = {
  id: string;
  name_es: string;
  aliases: string[];
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
};

const num = (v: string | number | null) => (v == null ? null : Number(v));

export async function foodsForDrafts(tx: Tx) {
  const rows = await tx<FoodForDraftRow[]>`
    select id, name_es, aliases, protein_g::text, carbs_g::text, fat_g::text from foods order by name_es
  `;
  return rows.map((r) => ({
    id: r.id,
    name_es: r.name_es,
    aliases: r.aliases,
    protein_g: num(r.protein_g),
    carbs_g: num(r.carbs_g),
    fat_g: num(r.fat_g)
  }));
}

/** Plantillas del deportista y generales (athlete_id null). */
export async function portionTemplatesFor(tx: Tx, athleteId: string) {
  const rows = await tx<
    { athlete_id: string | null; day_type: "rest" | "training" | "match"; slot: MealSlotKind; role: string; grams: string }[]
  >`
    select athlete_id, day_type, slot, role, grams::text
    from portion_templates
    where athlete_id is null or athlete_id = ${athleteId}
  `;
  return rows.map((r) => ({
    athleteId: r.athlete_id,
    dayType: r.day_type,
    slot: r.slot,
    role: r.role as "veg" | "protein" | "carb" | "fat" | "other",
    grams: Number(r.grams)
  }));
}

export type MealSlotForDraft = {
  id: string;
  date: string;
  slot: MealSlotKind;
  title: string;
  preparation: string | null;
  itemsTextHash: string | null;
  mdTag: string | null;
};

export async function mealSlotsForDrafts(
  tx: Tx,
  athleteId: string,
  range: { from: string; to: string } | { ids: string[] }
): Promise<MealSlotForDraft[]> {
  const filter =
    "ids" in range
      ? tx`ms.id = any(${range.ids}::uuid[])`
      : tx`ms.date between ${range.from}::date and ${range.to}::date`;
  const rows = await tx<
    {
      id: string;
      date: string;
      slot: MealSlotKind;
      title: string;
      preparation: string | null;
      items_text_hash: string | null;
      md_tag: string | null;
    }[]
  >`
    select ms.id, ms.date::text, ms.slot, ms.title, ms.preparation, ms.items_text_hash, dp.md_tag
    from meal_slots ms
    left join lateral (
      select md_tag from day_plans where athlete_id = ms.athlete_id and date = ms.date limit 1
    ) dp on true
    where ms.athlete_id = ${athleteId} and ${filter}
    order by ms.date, ms.slot
  `;
  return rows.map((r) => ({
    id: r.id,
    date: isoDate(r.date),
    slot: r.slot,
    title: r.title,
    preparation: r.preparation,
    itemsTextHash: r.items_text_hash,
    mdTag: r.md_tag
  }));
}

export async function deleteUnconfirmedMealItems(tx: Tx, mealSlotId: string) {
  const rows = await tx<{ id: string }[]>`
    delete from meal_items where meal_slot_id = ${mealSlotId} and not confirmed returning id
  `;
  return rows.length;
}

export async function hasConfirmedMealItems(tx: Tx, mealSlotId: string, textHash: string) {
  const rows = await tx<{ ok: boolean }[]>`
    select exists (
      select 1 from meal_items where meal_slot_id = ${mealSlotId} and confirmed and text_hash = ${textHash}
    ) as ok
  `;
  return rows[0]?.ok ?? false;
}

export async function insertDraftMealItems(
  tx: Tx,
  mealSlotId: string,
  textHash: string,
  items: { food_id: string | null; raw_text: string; role: string; grams: number | null; position: number }[]
) {
  for (const it of items) {
    await tx`
      insert into meal_items (meal_slot_id, food_id, raw_text, role, grams, origin, confirmed, position, text_hash)
      values (${mealSlotId}, ${it.food_id}, ${it.raw_text}, ${it.role}, ${it.grams}, 'rule', false, ${it.position}, ${textHash})
    `;
  }
  return items.length;
}

export async function setMealSlotItemsHash(tx: Tx, mealSlotId: string, textHash: string) {
  await tx`update meal_slots set items_text_hash = ${textHash} where id = ${mealSlotId}`;
}

export type MealItem = {
  id: string;
  mealSlotId: string;
  athleteId: string;
  foodId: string | null;
  rawText: string;
  role: "veg" | "protein" | "carb" | "fat" | "other";
  grams: number | null;
  origin: "rule" | "manual" | "llm";
  confirmed: boolean;
  position: number;
  /** El texto del plato cambió desde que se generó el item: no cuenta en totales. */
  obsolete: boolean;
};

type MealItemRow = {
  id: string;
  meal_slot_id: string;
  athlete_id: string;
  food_id: string | null;
  raw_text: string;
  role: MealItem["role"];
  grams: string | null;
  origin: MealItem["origin"];
  confirmed: boolean;
  position: number;
  obsolete: boolean;
};

function mapMealItem(r: MealItemRow): MealItem {
  return {
    id: r.id,
    mealSlotId: r.meal_slot_id,
    athleteId: r.athlete_id,
    foodId: r.food_id,
    rawText: r.raw_text,
    role: r.role,
    grams: num(r.grams),
    origin: r.origin,
    confirmed: r.confirmed,
    position: r.position,
    obsolete: r.obsolete
  };
}

export async function mealItemsByIds(tx: Tx, ids: string[]) {
  const rows = await tx<MealItemRow[]>`
    select mi.id, mi.meal_slot_id, ms.athlete_id, mi.food_id, mi.raw_text, mi.role, mi.grams::text, mi.origin,
      mi.confirmed, mi.position,
      mi.text_hash is distinct from md5(coalesce(nullif(ms.preparation, ''), ms.title)) as obsolete
    from meal_items mi
    join meal_slots ms on ms.id = mi.meal_slot_id
    where mi.id = any(${ids}::uuid[])
    order by mi.meal_slot_id, mi.position
  `;
  return rows.map(mapMealItem);
}

export async function updateMealItem(
  tx: Tx,
  id: string,
  patch: { foodId?: string | null; grams?: number | null; role?: MealItem["role"]; confirmed?: boolean }
) {
  const manual = patch.foodId !== undefined || patch.grams !== undefined || patch.role !== undefined;
  await tx`
    update meal_items set
      food_id = ${patch.foodId === undefined ? tx`food_id` : patch.foodId},
      grams = ${patch.grams === undefined ? tx`grams` : patch.grams},
      role = ${patch.role === undefined ? tx`role` : patch.role},
      confirmed = ${patch.confirmed === undefined ? tx`confirmed` : patch.confirmed},
      origin = ${manual ? "manual" : tx`origin`}
    where id = ${id}
  `;
}

/** Items de un plato (vigentes y obsoletos) con el deportista; null si el plato no existe o no es visible. */
export async function mealItemsForSlot(tx: Tx, mealSlotId: string) {
  const slot = await tx<{ athlete_id: string }[]>`select athlete_id from meal_slots where id = ${mealSlotId} limit 1`;
  if (!slot[0]) return null;
  const rows = await tx<MealItemRow[]>`
    select mi.id, mi.meal_slot_id, ms.athlete_id, mi.food_id, mi.raw_text, mi.role, mi.grams::text, mi.origin,
      mi.confirmed, mi.position,
      mi.text_hash is distinct from md5(coalesce(nullif(ms.preparation, ''), ms.title)) as obsolete
    from meal_items mi
    join meal_slots ms on ms.id = mi.meal_slot_id
    where mi.meal_slot_id = ${mealSlotId}
    order by mi.position
  `;
  return { athleteId: slot[0].athlete_id, items: rows.map(mapMealItem) };
}

const NUTRIENT_KEYS = [
  "kcal",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
  "sodium_mg",
  "iron_mg",
  "calcium_mg",
  "vit_d_ug"
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

/** Suma de los platos cuantificados; `incomplete` = algún alimento sumado no tiene ese valor (null en foods). */
export type NutrientSum = { value: number; incomplete: boolean };

export type DayNutrition = {
  date: string;
  /** Platos del menú ese día. */
  planned: number;
  /** Platos que cuentan: todos sus items vigentes confirmados con alimento y gramos. */
  quantified: number;
  totals: Record<NutrientKey, NutrientSum>;
};

export type NutritionTotals = { weightKg: number | null; days: DayNutrition[] };

type QuantItemRow = { meal_slot_id: string; ok: boolean; grams: string | null } & Record<
  NutrientKey,
  string | null
>;

/**
 * Totales del menú planificado por día. Un plato cuenta si todos sus items vigentes (text_hash = hash actual)
 * están confirmados con `food_id` y `grams`; los condimentos `other` sin gramos no bloquean ni suman.
 * Los items obsoletos no cuentan. Días sin platos no aparecen.
 */
export async function nutritionTotals(tx: Tx, athleteId: string, from: string, to: string): Promise<NutritionTotals> {
  const athlete = await tx<{ weight_kg: string | null }[]>`select weight_kg::text from athletes where id = ${athleteId}`;
  const slots = await tx<{ id: string; date: string }[]>`
    select id, date::text from meal_slots
    where athlete_id = ${athleteId} and date between ${from}::date and ${to}::date
  `;
  const items = await tx<QuantItemRow[]>`
    select mi.meal_slot_id, (mi.confirmed and mi.food_id is not null and mi.grams is not null) as ok,
      mi.grams::text, f.kcal::text, f.protein_g::text, f.carbs_g::text, f.fat_g::text, f.fiber_g::text,
      f.sodium_mg::text, f.iron_mg::text, f.calcium_mg::text, f.vit_d_ug::text
    from meal_slots ms
    join meal_items mi on mi.meal_slot_id = ms.id
      and mi.text_hash = md5(coalesce(nullif(ms.preparation, ''), ms.title))
    left join foods f on f.id = mi.food_id
    where ms.athlete_id = ${athleteId} and ms.date between ${from}::date and ${to}::date
      and not (mi.role = 'other' and mi.grams is null)
  `;

  const bySlot = new Map<string, QuantItemRow[]>();
  for (const it of items) bySlot.set(it.meal_slot_id, [...(bySlot.get(it.meal_slot_id) ?? []), it]);

  const empty = () =>
    Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, { value: 0, incomplete: false }])) as Record<NutrientKey, NutrientSum>;
  const days = new Map<string, DayNutrition>();
  for (const s of slots) {
    const date = isoDate(s.date);
    const day = days.get(date) ?? { date, planned: 0, quantified: 0, totals: empty() };
    days.set(date, day);
    day.planned += 1;
    const rows = bySlot.get(s.id);
    if (!rows?.length || !rows.every((r) => r.ok)) continue;
    day.quantified += 1;
    for (const r of rows) {
      const grams = Number(r.grams);
      for (const k of NUTRIENT_KEYS) {
        if (r[k] == null) day.totals[k].incomplete = true;
        else day.totals[k].value += (grams * Number(r[k])) / 100;
      }
    }
  }
  return {
    weightKg: num(athlete[0]?.weight_kg ?? null),
    days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
  };
}
