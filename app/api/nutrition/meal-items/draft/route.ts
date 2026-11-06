import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { generateMealItemDrafts } from "@/lib/nutrition/generate-drafts";
import { daysBetween, parseDateLocal } from "@/lib/dates";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const Body = z.object({
  athleteId: z.string().uuid(),
  from: IsoDate,
  to: IsoDate,
  /** Regenera también los platos sin cambios (p. ej. tras cargar la plantilla). Nunca toca confirmados. */
  force: z.boolean().optional()
});

const MAX_RANGE_DAYS = 62;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const { athleteId, from, to, force } = parsed.data;

  const span = daysBetween(parseDateLocal(from), parseDateLocal(to));
  if (span < 0) return apiError(422, "VALIDATION_ERROR", "La fecha final es anterior a la inicial");
  if (span > MAX_RANGE_DAYS) return apiError(422, "VALIDATION_ERROR", `Máximo ${MAX_RANGE_DAYS} días por petición`);

  if (!(await canSeeAthleteNutrition(user, athleteId))) return notFound();

  const data = await withRls(rlsFrom(user), (tx) => generateMealItemDrafts(tx, athleteId, { from, to }, { force }));
  return NextResponse.json({ data });
}
