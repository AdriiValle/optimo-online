import { z } from "zod";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { accountById, setOwnPasswordHash } from "@/lib/queries";

const Schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200)
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "athlete" && user.role !== "admin") return notFound();

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid password", parsed.error.flatten());
  }

  const account = await withRls(rlsFrom(user), (tx) => accountById(tx, user.id));
  if (!account) return notFound();
  const currentOk = await bcrypt.compare(parsed.data.currentPassword, account.password_hash);
  if (!currentOk) {
    return apiError(422, "VALIDATION_ERROR", "Contraseña actual incorrecta");
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  const saved = await withRls(rlsFrom(user), (tx) => setOwnPasswordHash(tx, hash));
  if (!saved) return notFound();

  return NextResponse.json({ data: { ok: true } });
}
