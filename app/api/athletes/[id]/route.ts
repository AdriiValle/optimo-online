import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthlete } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { athleteById, updateAthleteName } from "@/lib/queries";

const Schema = z.object({
  name: z.string().min(1).max(120)
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  const { id } = await params;
  if (!canSeeAthlete(user, id)) return notFound();

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid name", parsed.error.flatten());
  }

  const name = parsed.data.name.trim();
  const athlete = await withRls(rlsFrom(user), async (tx) => {
    const found = await athleteById(tx, id);
    if (!found) return null;
    await updateAthleteName(tx, id, name);
    return found;
  });
  if (!athlete) return notFound();

  return NextResponse.json({ data: { ok: true, name } });
}
