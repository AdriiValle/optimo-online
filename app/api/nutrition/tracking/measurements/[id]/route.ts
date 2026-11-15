import { z } from "zod";
import { NextResponse } from "next/server";
import { rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { notFound } from "@/lib/errors";
import { deleteMeasurement, measurementsFor, syncProfileWeight } from "@/lib/nutrition/tracking-queries";
import { authorizeTracking } from "../../shared";

type Ctx = { params: Promise<{ id: string }> };

const NOT_SAVED = Symbol("not-saved");

/** Borra un registro; el peso del perfil pasa al registro anterior con peso (si no queda ninguno, no cambia). */
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const athleteId = new URL(req.url).searchParams.get("athleteId") ?? "";
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(athleteId).success) return notFound();
  const auth = await authorizeTracking(athleteId);
  if ("error" in auth) return auth.error;

  const data = await withRls(rlsFrom(auth.user), async (tx) => {
    if (!(await deleteMeasurement(tx, athleteId, id))) throw NOT_SAVED;
    const profileWeightKg = await syncProfileWeight(tx, athleteId, auth.user.role === "nutritionist");
    if (profileWeightKg === false) throw NOT_SAVED;
    return { measurements: await measurementsFor(tx, athleteId), profileWeightKg };
  }).catch((e) => {
    if (e === NOT_SAVED) return null;
    throw e;
  });
  if (!data) return notFound();
  return NextResponse.json({ data });
}
