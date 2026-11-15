import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { notFound, unauthenticated } from "@/lib/errors";
import { athleteIdOfSlot, checkPhotoFor } from "@/lib/nutrition/tracking-queries";
import { authorizeTracking } from "../../../shared";

type Ctx = { params: Promise<{ slotId: string }> };

/** Foto real del check del deportista, para ponerla junto a la del plan en Seguimiento. */
export async function GET(_req: Request, ctx: Ctx) {
  const { slotId } = await ctx.params;
  if (!z.string().uuid().safeParse(slotId).success) return notFound();
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();
  const athleteId = await withRls(rlsFrom(user), (tx) => athleteIdOfSlot(tx, slotId));
  if (!athleteId) return notFound();
  const auth = await authorizeTracking(athleteId);
  if ("error" in auth) return auth.error;

  const photo = await withRls(rlsFrom(auth.user), (tx) => checkPhotoFor(tx, athleteId, slotId));
  if (!photo) return notFound();
  return new Response(photo.bytes, {
    headers: { "Content-Type": photo.mime, "Cache-Control": "private, max-age=3600" }
  });
}
