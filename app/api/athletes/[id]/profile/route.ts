import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { athleteProfile, updateAthleteProfile } from "@/lib/queries";

const Schema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  heightCm: z.number().min(100).max(250).nullable(),
  weightKg: z.number().min(25).max(250).nullable()
});

type Ctx = { params: Promise<{ id: string }> };

async function authorize(athleteId: string) {
  const user = await currentUser();
  if (!user) return { error: unauthenticated() } as const;
  if (user.role !== "admin" && user.role !== "nutritionist") return { error: notFound() } as const;
  if (!(await canSeeAthleteNutrition(user, athleteId))) return { error: notFound() } as const;
  return { user } as const;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if ("error" in auth) return auth.error;
  const data = await withRls(rlsFrom(auth.user), (tx) => athleteProfile(tx, id));
  if (!data) return notFound();
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if ("error" in auth) return auth.error;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const ok = await withRls(rlsFrom(auth.user), (tx) =>
    updateAthleteProfile(tx, id, parsed.data, auth.user.role === "nutritionist")
  );
  if (!ok) return notFound();
  return NextResponse.json({ data: parsed.data });
}
