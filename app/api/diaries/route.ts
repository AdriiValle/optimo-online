import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthlete } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { dayBlocks, diaryFor } from "@/lib/queries";

const GetSchema = z.object({
  athleteId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const BodySchema = z.object({
  athleteId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  sleepQuality: z.number().int().min(1).max(100).nullable().optional(),
  recovery: z.number().int().min(0).max(100).nullable().optional(),
  hrv: z.number().min(0).max(400).nullable().optional(),
  restingHr: z.number().int().min(20).max(220).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  km: z.number().min(0).max(400).nullable().optional(),
  avgHr: z.number().int().min(20).max(220).nullable().optional(),
  /** Molestias del deportista; columna BD `diet_note` (legacy). */
  dietNote: z.string().max(4000).nullable().optional(),
  freeNote: z.string().max(4000).nullable().optional()
});

type DiaryField =
  | "sleepHours"
  | "sleepQuality"
  | "recovery"
  | "hrv"
  | "restingHr"
  | "rpe"
  | "km"
  | "avgHr"
  | "dietNote"
  | "freeNote";

const FIELD_TO_KEY: Record<DiaryField, string> = {
  sleepHours: "sleepHours",
  sleepQuality: "sleepQuality",
  recovery: "recovery",
  hrv: "hrv",
  restingHr: "restingHr",
  rpe: "rpe",
  km: "km",
  avgHr: "avgHr",
  dietNote: "dietNote",
  freeNote: "freeNote"
};

function touchedFields(raw: Record<string, unknown>): Set<DiaryField> {
  const set = new Set<DiaryField>();
  for (const field of Object.keys(FIELD_TO_KEY) as DiaryField[]) {
    if (Object.prototype.hasOwnProperty.call(raw, field)) set.add(field);
  }
  return set;
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  const url = new URL(req.url);
  const parsed = GetSchema.safeParse({
    athleteId: url.searchParams.get("athleteId"),
    date: url.searchParams.get("date")
  });
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid query", parsed.error.flatten());
  }
  if (!canSeeAthlete(user, parsed.data.athleteId)) return notFound();

  const { diary, blocks } = await withRls(rlsFrom(user), async (tx) => ({
    diary: await diaryFor(tx, parsed.data.athleteId, parsed.data.date),
    blocks: await dayBlocks(tx, parsed.data.athleteId, parsed.data.date)
  }));
  return NextResponse.json({ data: diary, blocks });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid diary", parsed.error.flatten());
  }
  if (!canSeeAthlete(user, parsed.data.athleteId)) return notFound();

  const d = parsed.data;
  const touch = touchedFields(json ?? {});

  const saved = await withRls(rlsFrom(user), async (tx) => {
    const tSleep = touch.has("sleepHours");
    const tQuality = touch.has("sleepQuality");
    const tRecovery = touch.has("recovery");
    const tHrv = touch.has("hrv");
    const tRhr = touch.has("restingHr");
    const tRpe = touch.has("rpe");
    const tKm = touch.has("km");
    const tAvg = touch.has("avgHr");
    const tDiet = touch.has("dietNote");
    const tFree = touch.has("freeNote");

    const sleepHours = tSleep ? (d.sleepHours ?? null) : null;
    const sleepQuality = tQuality ? (d.sleepQuality ?? null) : null;
    const recovery = tRecovery ? (d.recovery ?? null) : null;
    const hrv = tHrv ? (d.hrv ?? null) : null;
    const restingHr = tRhr ? (d.restingHr ?? null) : null;
    const rpe = tRpe ? (d.rpe ?? null) : null;
    const km = tKm ? (d.km ?? null) : null;
    const avgHr = tAvg ? (d.avgHr ?? null) : null;
    const dietNote = tDiet ? (d.dietNote ?? null) : null;
    const freeNote = tFree ? (d.freeNote ?? null) : null;

    await tx`
      insert into diaries (
        athlete_id, date, sleep_hours, sleep_quality, recovery, hrv, resting_hr,
        rpe, feeling, km, avg_hr, diet_note, free_note
      ) values (
        ${d.athleteId}, ${d.date}::date,
        ${tSleep ? sleepHours : null},
        ${tQuality ? sleepQuality : null},
        ${tRecovery ? recovery : null},
        ${tHrv ? hrv : null},
        ${tRhr ? restingHr : null},
        ${tRpe ? rpe : null},
        null,
        ${tKm ? km : null},
        ${tAvg ? avgHr : null},
        ${tDiet ? dietNote : null},
        ${tFree ? freeNote : null}
      )
      on conflict (athlete_id, date) do update set
        sleep_hours = case when ${tSleep} then excluded.sleep_hours else diaries.sleep_hours end,
        sleep_quality = case when ${tQuality} then excluded.sleep_quality else diaries.sleep_quality end,
        recovery = case when ${tRecovery} then excluded.recovery else diaries.recovery end,
        hrv = case when ${tHrv} then excluded.hrv else diaries.hrv end,
        resting_hr = case when ${tRhr} then excluded.resting_hr else diaries.resting_hr end,
        rpe = case when ${tRpe} then excluded.rpe else diaries.rpe end,
        km = case when ${tKm} then excluded.km else diaries.km end,
        avg_hr = case when ${tAvg} then excluded.avg_hr else diaries.avg_hr end,
        diet_note = case when ${tDiet} then excluded.diet_note else diaries.diet_note end,
        free_note = case when ${tFree} then excluded.free_note else diaries.free_note end
    `;
    return diaryFor(tx, d.athleteId, d.date);
  });

  return NextResponse.json({ data: saved });
}
