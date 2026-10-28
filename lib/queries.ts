import type { Tx } from "@/lib/db";
import type { Athlete, DayPlan, Diary, Injury, SessionUser, Sport } from "@/lib/types";
import { isoDate } from "@/lib/dates";

type AccountRow = { id: string; email: string; password_hash: string; role: SessionUser["role"] };
type AthleteRow = {
  id: string;
  account_id: string;
  name: string;
  sport: Sport;
  photo_bytes: Uint8Array | Buffer | null;
  photo_mime: string | null;
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
    hasPhoto: Boolean(row.photo_bytes && row.photo_bytes.length),
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
    select id, account_id, name, sport, photo_bytes, photo_mime, team, shirt_number, diet_notes, sleep_routine
    from athletes
    where account_id = ${accountId}
    limit 1
  `;
  return rows[0] ? mapAthlete(rows[0]) : null;
}

export async function athleteById(tx: Tx, id: string) {
  const rows = await tx<AthleteRow[]>`
    select id, account_id, name, sport, photo_bytes, photo_mime, team, shirt_number, diet_notes, sleep_routine
    from athletes
    where id = ${id}
    limit 1
  `;
  return rows[0] ? mapAthlete(rows[0]) : null;
}

export async function listAthletes(tx: Tx) {
  const rows = await tx<AthleteRow[]>`
    select id, account_id, name, sport, photo_bytes, photo_mime, team, shirt_number, diet_notes, sleep_routine
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
    dietNote: r.diet_note,
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

export async function photoFor(tx: Tx, athleteId: string) {
  const rows = await tx<{ photo_bytes: Buffer | Uint8Array | null; photo_mime: string | null }[]>`
    select photo_bytes, photo_mime from athletes where id = ${athleteId} limit 1
  `;
  const row = rows[0];
  if (!row?.photo_bytes || !row.photo_bytes.length) return null;
  return { bytes: Buffer.from(row.photo_bytes), mime: row.photo_mime || "image/jpeg" };
}
