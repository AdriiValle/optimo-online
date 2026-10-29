import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { athleteById, updateAthleteNutrition } from "@/lib/queries";

const SupplementSchema = z.object({
  name: z.string().trim().min(1).max(120),
  time: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(500).nullable().optional()
});

const PatchSchema = z.object({
  dietNotes: z.string().max(12000).nullable(),
  supplements: z.array(SupplementSchema).max(40)
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const { id: athleteId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid nutrition payload", parsed.error.flatten());
  }

  const dietNotes = parsed.data.dietNotes?.trim() || null;
  const supplements = parsed.data.supplements.map((s) => ({
    name: s.name,
    time: s.time,
    notes: s.notes?.trim() || null
  }));

  const updated = await withRls(rlsFrom(user), async (tx) => {
    const exists = await athleteById(tx, athleteId);
    if (!exists) return null;
    return updateAthleteNutrition(tx, athleteId, dietNotes, supplements);
  });

  if (!updated) return notFound();
  return NextResponse.json({ data: updated });
}
