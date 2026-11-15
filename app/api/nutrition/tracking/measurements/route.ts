import { z } from "zod";
import { NextResponse } from "next/server";
import { rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound } from "@/lib/errors";
import { todayKey } from "@/lib/dates";
import { measurementsFor, syncProfileWeight, upsertMeasurement } from "@/lib/nutrition/tracking-queries";
import { authorizeTracking } from "../shared";

const Num = (min: number, max: number) => z.number().finite().min(min).max(max).nullable();

/** Mismos límites de peso que la ficha del perfil (25–250 kg) para que el último registro siempre quepa. */
const Schema = z
  .object({
    athleteId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weightKg: Num(25, 250),
    bodyFatPct: Num(1, 70),
    skinfoldSumMm: Num(1, 500),
    waistCm: Num(30, 250),
    notes: z.string().trim().max(500).nullable()
  })
  .refine((m) => m.date <= todayKey(), { message: "La fecha no puede ser futura", path: ["date"] })
  .refine((m) => [m.weightKg, m.bodyFatPct, m.skinfoldSumMm, m.waistCm].some((v) => v != null) || !!m.notes, {
    message: "Nada que guardar"
  });

const NOT_SAVED = Symbol("not-saved");

export async function GET(req: Request) {
  const athleteId = new URL(req.url).searchParams.get("athleteId") ?? "";
  if (!z.string().uuid().safeParse(athleteId).success) return notFound();
  const auth = await authorizeTracking(athleteId);
  if ("error" in auth) return auth.error;
  const data = await withRls(rlsFrom(auth.user), (tx) => measurementsFor(tx, athleteId));
  return NextResponse.json({ data });
}

/** Guarda (o sustituye la de esa fecha) y deja el peso del perfil igual al último registro con peso. */
export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const { athleteId, ...m } = parsed.data;
  const auth = await authorizeTracking(athleteId);
  if ("error" in auth) return auth.error;

  const data = await withRls(rlsFrom(auth.user), async (tx) => {
    const saved = await upsertMeasurement(tx, athleteId, { ...m, notes: m.notes || null });
    if (!saved) throw NOT_SAVED;
    const profileWeightKg = await syncProfileWeight(tx, athleteId, auth.user.role === "nutritionist");
    if (profileWeightKg === false) throw NOT_SAVED;
    return { measurement: saved, measurements: await measurementsFor(tx, athleteId), profileWeightKg };
  }).catch((e) => {
    if (e === NOT_SAVED) return null;
    throw e;
  });
  if (!data) return notFound();
  return NextResponse.json({ data });
}
