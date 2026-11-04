import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthlete } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { deleteIntegrationTokens } from "@/lib/integrations/store";

const BodySchema = z.object({ athleteId: z.string().uuid() });

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid body", parsed.error.flatten());
  }

  const { athleteId } = parsed.data;
  if (user.role === "athlete" && user.athleteId !== athleteId) return notFound();
  if (!canSeeAthlete(user, athleteId)) return notFound();

  await withRls(rlsFrom(user), async (tx) => {
    await deleteIntegrationTokens(tx, athleteId, "polar");
    await tx`
      update integrations
      set status = 'disconnected', last_error = null, last_sync_at = null, updated_at = now()
      where athlete_id = ${athleteId} and provider = 'polar'
    `;
  });

  return NextResponse.json({ data: { disconnected: true } });
}
