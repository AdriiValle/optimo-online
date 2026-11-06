import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { nutritionTotals } from "@/lib/queries";
import { daysBetween, parseDateLocal } from "@/lib/dates";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const Query = z.object({ athleteId: z.string().uuid(), from: IsoDate, to: IsoDate });

const MAX_RANGE_DAYS = 62;

/** Totales del menú planificado por día (solo platos cuantificados) + peso para g/kg. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();

  const url = new URL(req.url);
  const parsed = Query.safeParse({
    athleteId: url.searchParams.get("athleteId"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to")
  });
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const { athleteId, from, to } = parsed.data;

  const span = daysBetween(parseDateLocal(from), parseDateLocal(to));
  if (span < 0 || span > MAX_RANGE_DAYS) return apiError(422, "VALIDATION_ERROR", `Rango de 1 a ${MAX_RANGE_DAYS + 1} días`);

  if (!(await canSeeAthleteNutrition(user, athleteId))) return notFound();

  const data = await withRls(rlsFrom(user), (tx) => nutritionTotals(tx, athleteId, from, to));
  return NextResponse.json({ data });
}
