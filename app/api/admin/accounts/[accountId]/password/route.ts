import { z } from "zod";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { accountById, setAccountPasswordHash } from "@/lib/queries";

const Schema = z.object({
  password: z.string().min(8).max(200)
});

type Params = { params: Promise<{ accountId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const { accountId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid password", parsed.error.flatten());
  }

  const exists = await withRls(rlsFrom(user), (tx) => accountById(tx, accountId));
  if (!exists) return notFound();

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await withRls(rlsFrom(user), (tx) => setAccountPasswordHash(tx, accountId, hash));
  return NextResponse.json({ data: { ok: true } });
}
