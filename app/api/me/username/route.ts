import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { accountEmailTaken, setOwnAccountEmail } from "@/lib/queries";
import { parseUsername } from "@/lib/username";

const Body = z.object({ username: z.unknown() });

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "athlete" && user.role !== "admin") return notFound();

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
  if (username === user.email.trim().toLowerCase()) {
    return NextResponse.json({ data: { username } });
  }

  const taken = await withRls(rlsFrom(user), (tx) => accountEmailTaken(tx, username, user.id));
  if (taken) {
    return apiError(422, "VALIDATION_ERROR", "Ese nombre de usuario ya está en uso.");
  }

  const saved = await withRls(rlsFrom(user), (tx) => setOwnAccountEmail(tx, username));
  if (!saved) {
    return apiError(422, "VALIDATION_ERROR", "No se pudo guardar el nombre de usuario.");
  }

  return NextResponse.json({ data: { username } });
}
