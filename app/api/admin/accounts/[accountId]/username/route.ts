import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { accountById, accountEmailTaken, setAccountEmail } from "@/lib/queries";
import { parseUsername } from "@/lib/username";

const Body = z.object({ username: z.unknown() });

type Params = { params: Promise<{ accountId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const { accountId } = await params;
  const json = await req.json().catch(() => null);
  const body = Body.safeParse(json);
  if (!body.success) {
    return apiError(422, "VALIDATION_ERROR", "Datos no válidos", body.error.flatten());
  }

  const parsed = parseUsername(body.data.username);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Usuario no válido");
  }
  const username = parsed.data;

  const account = await withRls(rlsFrom(user), (tx) => accountById(tx, accountId));
  if (!account) return notFound();
  if (username === account.email) {
    return NextResponse.json({ data: { username } });
  }

  const taken = await withRls(rlsFrom(user), (tx) => accountEmailTaken(tx, username, accountId));
  if (taken) {
    return apiError(422, "VALIDATION_ERROR", "Ese nombre de usuario ya está en uso.");
  }

  const saved = await withRls(rlsFrom(user), (tx) => setAccountEmail(tx, accountId, username));
  if (!saved) return notFound();

  return NextResponse.json({ data: { username } });
}
