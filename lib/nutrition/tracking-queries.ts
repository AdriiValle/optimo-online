import type { Tx } from "@/lib/db";
import type { BodyMeasurement, MealCheckStatus, MealSlotKind } from "@/lib/types";
import { athleteProfile, updateAthleteProfile } from "@/lib/queries";
import { addDays, dateKey, parseDateLocal, startOfWeekMonday } from "@/lib/dates";
import { dayTypeFromMdTag, type DayType } from "./day-type";

/**
 * Seguimiento de la nutricionista: cumplimiento del menú a partir de `meal_checks` y medidas corporales
 * (`body_measurements`). Solo para el panel de Amanda/admin; el acceso se comprueba en la ruta.
 */

/** Recuento de una franja de checks: ✓ hecho, ½ a medias, ✕ no, y franjas del plan sin marcar. */
export type ComplianceCount = { planned: number; done: number; half: number; missed: number };

/** Cumplimiento sobre lo marcado: ✓ cuenta 1, ½ cuenta 0,5. null si aún no hay nada marcado. */
export function complianceScore(c: ComplianceCount): number | null {
  const marked = c.done + c.half + c.missed;
  return marked ? (c.done + c.half * 0.5) / marked : null;
}

export type ComplianceWeek = ComplianceCount & { weekStart: string };
export type ComplianceDayType = ComplianceCount & { dayType: DayType };

export type CheckEntry = {
  mealSlotId: string;
  date: string;
  slot: MealSlotKind;
  title: string;
  dayType: DayType;
  status: MealCheckStatus;
  note: string | null;
  hasPhoto: boolean;
  hasPlanPhoto: boolean;
};

export type TrackingCompliance = {
  from: string;
  to: string;
  weeks: ComplianceWeek[];
  byDayType: ComplianceDayType[];
  /** Checks con foto o comentario, del más reciente al más antiguo. */
  entries: CheckEntry[];
};

const empty = (): ComplianceCount => ({ planned: 0, done: 0, half: 0, missed: 0 });

function add(c: ComplianceCount, status: MealCheckStatus | null) {
  c.planned += 1;
  if (status === "done") c.done += 1;
  else if (status === "half") c.half += 1;
  else if (status === "missed") c.missed += 1;
}

/** Semanas (lunes–domingo) hasta `today` incluida; solo cuentan las franjas con plato hasta hoy. */
export async function trackingCompliance(tx: Tx, athleteId: string, today: string, weeks = 8): Promise<TrackingCompliance> {
  const to = today;
  const from = dateKey(addDays(parseDateLocal(startOfWeekMonday(today)), -7 * (weeks - 1)));
  const rows = await tx<
    {
      id: string;
      date: string;
      slot: MealSlotKind;
      title: string;
      has_plan_photo: boolean;
      md_tag: string | null;
      status: MealCheckStatus | null;
      note: string | null;
      has_photo: boolean;
    }[]
  >`
    select ms.id, ms.date::text as date, ms.slot, ms.title,
      (ms.photo_bytes is not null and octet_length(ms.photo_bytes) > 0) as has_plan_photo,
      dp.md_tag,
      mc.status, mc.note,
      coalesce(mc.photo_bytes is not null and octet_length(mc.photo_bytes) > 0, false) as has_photo
    from meal_slots ms
    left join day_plans dp on dp.athlete_id = ms.athlete_id and dp.date = ms.date
    left join meal_checks mc on mc.meal_slot_id = ms.id
    where ms.athlete_id = ${athleteId}
      and ms.date between ${from}::date and ${to}::date
      and (btrim(ms.title) <> '' or mc.meal_slot_id is not null)
    order by ms.date desc, ms.slot
  `;

  const weekMap = new Map<string, ComplianceCount>();
  for (let i = 0; i < weeks; i++) {
    weekMap.set(dateKey(addDays(parseDateLocal(from), i * 7)), empty());
  }
  const dayMap = new Map<DayType, ComplianceCount>([
    ["training", empty()],
    ["match", empty()],
    ["rest", empty()]
  ]);
  const entries: CheckEntry[] = [];

  for (const r of rows) {
    const dayType = dayTypeFromMdTag(r.md_tag);
    const week = weekMap.get(startOfWeekMonday(r.date));
    if (week) add(week, r.status);
    add(dayMap.get(dayType)!, r.status);
    if (r.status && (r.has_photo || r.note?.trim())) {
      entries.push({
        mealSlotId: r.id,
        date: r.date,
        slot: r.slot,
        title: r.title,
        dayType,
        status: r.status,
        note: r.note?.trim() || null,
        hasPhoto: r.has_photo,
        hasPlanPhoto: r.has_plan_photo
      });
    }
  }

  return {
    from,
    to,
    weeks: [...weekMap].map(([weekStart, c]) => ({ weekStart, ...c })).reverse(),
    byDayType: [...dayMap].map(([dayType, c]) => ({ dayType, ...c })),
    entries
  };
}

/** Foto real que subió el deportista en su check, o null. */
export async function checkPhotoFor(tx: Tx, athleteId: string, mealSlotId: string) {
  const rows = await tx<{ photo_bytes: Buffer | Uint8Array | null; photo_mime: string | null }[]>`
    select mc.photo_bytes, mc.photo_mime
    from meal_checks mc
    join meal_slots ms on ms.id = mc.meal_slot_id
    where mc.meal_slot_id = ${mealSlotId} and ms.athlete_id = ${athleteId}
    limit 1
  `;
  const row = rows[0];
  if (!row?.photo_bytes || !row.photo_bytes.length) return null;
  return { bytes: Buffer.from(row.photo_bytes), mime: row.photo_mime || "image/jpeg" };
}

/** Deportista de una franja (para comprobar acceso antes de servir su foto). */
export async function athleteIdOfSlot(tx: Tx, mealSlotId: string) {
  const rows = await tx<{ athlete_id: string }[]>`select athlete_id from meal_slots where id = ${mealSlotId} limit 1`;
  return rows[0]?.athlete_id ?? null;
}

type MeasurementRow = {
  id: string;
  athlete_id: string;
  date: string;
  weight_kg: string | null;
  body_fat_pct: string | null;
  skinfold_sum_mm: string | null;
  waist_cm: string | null;
  notes: string | null;
};

const num = (v: string | null) => (v == null ? null : Number(v));

function toMeasurement(r: MeasurementRow): BodyMeasurement {
  return {
    id: r.id,
    athleteId: r.athlete_id,
    date: r.date,
    weightKg: num(r.weight_kg),
    bodyFatPct: num(r.body_fat_pct),
    skinfoldSumMm: num(r.skinfold_sum_mm),
    waistCm: num(r.waist_cm),
    notes: r.notes
  };
}

/** Medidas del deportista, de la más antigua a la más reciente (orden de la gráfica). */
export async function measurementsFor(tx: Tx, athleteId: string): Promise<BodyMeasurement[]> {
  const rows = await tx<MeasurementRow[]>`
    select id, athlete_id, date::text as date, weight_kg::text, body_fat_pct::text, skinfold_sum_mm::text,
      waist_cm::text, notes
    from body_measurements
    where athlete_id = ${athleteId}
    order by date asc
  `;
  return rows.map(toMeasurement);
}

export type MeasurementInput = {
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  skinfoldSumMm: number | null;
  waistCm: number | null;
  notes: string | null;
};

/** Una medida por día: si ya hay registro de esa fecha, se sustituye. */
export async function upsertMeasurement(tx: Tx, athleteId: string, m: MeasurementInput) {
  const rows = await tx<MeasurementRow[]>`
    insert into body_measurements (athlete_id, date, weight_kg, body_fat_pct, skinfold_sum_mm, waist_cm, notes)
    values (${athleteId}, ${m.date}::date, ${m.weightKg}, ${m.bodyFatPct}, ${m.skinfoldSumMm}, ${m.waistCm}, ${m.notes})
    on conflict (athlete_id, date) do update set
      weight_kg = excluded.weight_kg,
      body_fat_pct = excluded.body_fat_pct,
      skinfold_sum_mm = excluded.skinfold_sum_mm,
      waist_cm = excluded.waist_cm,
      notes = excluded.notes
    returning id, athlete_id, date::text as date, weight_kg::text, body_fat_pct::text, skinfold_sum_mm::text,
      waist_cm::text, notes
  `;
  return rows[0] ? toMeasurement(rows[0]) : null;
}

export async function deleteMeasurement(tx: Tx, athleteId: string, id: string) {
  const rows = await tx<{ id: string }[]>`
    delete from body_measurements where id = ${id} and athlete_id = ${athleteId} returning id
  `;
  return rows.length > 0;
}

/**
 * El peso del perfil = último registro con peso. Se escribe en `athletes.weight_kg` (de ahí leen la ficha
 * y los anillos) por la misma vía que el formulario de perfil. Sin registros con peso, el perfil no se toca.
 * Devuelve el peso que queda en el perfil, o false si no se pudo guardar.
 */
export async function syncProfileWeight(tx: Tx, athleteId: string, asNutritionist: boolean): Promise<number | null | false> {
  const latest = await tx<{ weight_kg: string }[]>`
    select weight_kg::text from body_measurements
    where athlete_id = ${athleteId} and weight_kg is not null
    order by date desc limit 1
  `;
  const profile = await athleteProfile(tx, athleteId);
  if (!profile) return false;
  if (!latest[0]) return profile.weightKg;
  const weightKg = Number(latest[0].weight_kg);
  if (profile.weightKg === weightKg) return weightKg;
  const ok = await updateAthleteProfile(
    tx,
    athleteId,
    { body: { birthDate: profile.birthDate, heightCm: profile.heightCm, weightKg } },
    asNutritionist
  );
  return ok ? weightKg : false;
}
