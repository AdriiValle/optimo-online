import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { setNutritionistAssignments } from "@/lib/queries";

const Schema = z.object({
  athleteIds: z.array(z.string().uuid()).max(200)
});

type Params = { params: Promise<{ accountId: string }> };

export async function PUT(req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const { accountId } = await params;
  if (!z.string().uuid().safeParse(accountId).success) return notFound();
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid assignments", parsed.error.flatten());
  }

  const athleteIds = [...new Set(parsed.data.athleteIds)];
  const ok = await withRls(rlsFrom(user), (tx) => setNutritionistAssignments(tx, accountId, athleteIds));
  if (!ok) return notFound();
  return NextResponse.json({ data: { accountId, athleteIds } });
}
