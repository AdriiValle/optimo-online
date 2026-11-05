import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { mealsForAthleteRange, upsertMealSlot } from "@/lib/queries";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const QuerySchema = z.object({
  athleteId: z.string().uuid(),
  from: IsoDate,
  to: IsoDate
});

const PutSchema = z.object({
  athleteId: z.string().uuid(),
  date: IsoDate,
  slot: z.enum(["breakfast", "lunch", "dinner"]),
  title: z.string().trim().min(1).max(200),
  preparation: z.string().max(8000).nullable().optional()
});

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    athleteId: url.searchParams.get("athleteId"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to")
  });
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid query", parsed.error.flatten());
  }
  const { athleteId, from, to } = parsed.data;
  if (!(await canSeeAthleteNutrition(user, athleteId))) return notFound();

  const data = await withRls(rlsFrom(user), (tx) => mealsForAthleteRange(tx, athleteId, from, to));
  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();

  const json = await req.json().catch(() => null);
  const parsed = PutSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid meal", parsed.error.flatten());
  }
  const { athleteId, date, slot, title } = parsed.data;
  if (!(await canSeeAthleteNutrition(user, athleteId))) return notFound();

  const preparation = parsed.data.preparation?.trim() || null;
  const data = await withRls(rlsFrom(user), (tx) => upsertMealSlot(tx, athleteId, date, slot, title, preparation));
  if (!data) return notFound();
  return NextResponse.json({ data });
}
