import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { notFound, unauthenticated } from "@/lib/errors";
import { mealCheckPhoto } from "@/lib/nutrition/checks-queries";

type Ctx = { params: Promise<{ id: string; slotId: string }> };

const Id = z.string().uuid();

/**
 * Foto del plato real del check del jugador (GET /a/[id]/nutrition/check-photo/[slotId]).
 * Vive bajo /a/ y no en /api/nutrition: allí el middleware solo deja pasar a la nutricionista.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id, slotId } = await ctx.params;
  if (!Id.safeParse(id).success || !Id.safeParse(slotId).success) return notFound();
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (!(await canSeeAthleteNutrition(user, id))) return notFound();
  const photo = await withRls(rlsFrom(user), (tx) => mealCheckPhoto(tx, id, slotId));
  if (!photo) return notFound();
  return new Response(new Uint8Array(photo.bytes), {
    headers: { "Content-Type": photo.mime, "Cache-Control": "private, max-age=3600" }
  });
}
