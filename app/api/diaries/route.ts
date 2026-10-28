import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthlete } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { diaryFor } from "@/lib/queries";

const GetSchema = z.object({
  athleteId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const BodySchema = z.object({
  athleteId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
  recovery: z.number().int().min(0).max(100).nullable().optional(),
  hrv: z.number().min(0).max(400).nullable().optional(),
  restingHr: z.number().int().min(20).max(220).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  feeling: z.number().int().min(1).max(5).nullable().optional(),
  km: z.number().min(0).max(400).nullable().optional(),
  avgHr: z.number().int().min(20).max(220).nullable().optional(),
  dietNote: z.string().max(4000).nullable().optional(),
  freeNote: z.string().max(4000).nullable().optional()
});

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

  const diary = await withRls(rlsFrom(user), (tx) =>
    diaryFor(tx, parsed.data.athleteId, parsed.data.date)
  );
  return NextResponse.json({ data: diary });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid diary", parsed.error.flatten());
  }
  if (!canSeeAthlete(user, parsed.data.athleteId)) return notFound();

  const d = parsed.data;
  const saved = await withRls(rlsFrom(user), async (tx) => {
    await tx`
      insert into diaries (
        athlete_id, date, sleep_hours, sleep_quality, recovery, hrv, resting_hr,
        rpe, feeling, km, avg_hr, diet_note, free_note
      ) values (
        ${d.athleteId}, ${d.date}::date, ${d.sleepHours ?? null}, ${d.sleepQuality ?? null},
        ${d.recovery ?? null}, ${d.hrv ?? null}, ${d.restingHr ?? null}, ${d.rpe ?? null},
        ${d.feeling ?? null}, ${d.km ?? null}, ${d.avgHr ?? null}, ${d.dietNote ?? null},
        ${d.freeNote ?? null}
      )
      on conflict (athlete_id, date) do update set
        sleep_hours = excluded.sleep_hours,
        sleep_quality = excluded.sleep_quality,
        recovery = excluded.recovery,
        hrv = excluded.hrv,
        resting_hr = excluded.resting_hr,
        rpe = excluded.rpe,
        feeling = excluded.feeling,
        km = excluded.km,
        avg_hr = excluded.avg_hr,
        diet_note = excluded.diet_note,
        free_note = excluded.free_note
    `;
    return diaryFor(tx, d.athleteId, d.date);
  });

  return NextResponse.json({ data: saved });
}
