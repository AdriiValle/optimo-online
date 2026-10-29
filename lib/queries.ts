import type { Tx } from "@/lib/db";
import type { Athlete, DayPlan, Diary, Injury, SessionUser, Sport } from "@/lib/types";
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
  sleep_routine: string | null;
};

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
      team, shirt_number, diet_notes, sleep_routine
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
      team, shirt_number, diet_notes, sleep_routine
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
      team, shirt_number, diet_notes, sleep_routine
    from athletes
    order by name
  `;
  return rows.map(mapAthlete);
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
  }[]>`
    select athlete_id, date::text, sleep_hours, sleep_quality, recovery, hrv, resting_hr, rpe, feeling, km, avg_hr, diet_note, free_note
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
    freeNote: r.free_note
  } satisfies Diary;
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
    freeNote: r.free_note
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
          'free_note', d.free_note
        )
        from diaries d
        where d.athlete_id = ${athleteId} and d.date = ${date}::date
      ) as diary,
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
    injuries: (row.injuries ?? []).map(mapInjuryJson)
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
      a.team, a.shirt_number, a.diet_notes, a.sleep_routine,
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

export async function photoFor(tx: Tx, athleteId: string) {
  const rows = await tx<{ photo_bytes: Buffer | Uint8Array | null; photo_mime: string | null }[]>`
    select photo_bytes, photo_mime from athletes where id = ${athleteId} limit 1
  `;
  const row = rows[0];
  if (!row?.photo_bytes || !row.photo_bytes.length) return null;
  return { bytes: Buffer.from(row.photo_bytes), mime: row.photo_mime || "image/jpeg" };
}
