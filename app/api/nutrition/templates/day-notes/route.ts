import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound } from "@/lib/errors";
import { dayNote, setDayNote } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, IsoDate, rls, Uuid } from "../shared";

/** Nota de la nutricionista para un día del deportista (la ve el jugador en la tarjeta del día). */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const athleteId = sp.get("athleteId") ?? "";
  const date = sp.get("date") ?? "";
  if (!Uuid.safeParse(athleteId).success || !IsoDate.safeParse(date).success) return notFound();
  const auth = await authorizeEditor(athleteId);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ data: await rls(auth.user)((tx) => dayNote(tx, athleteId, date)) });
}

const Body = z.object({ athleteId: Uuid, date: IsoDate, note: z.string().max(2000) });

/** Guarda la nota del día; vacía la borra. */
export async function PUT(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const { athleteId, date, note } = parsed.data;
  const auth = await authorizeEditor(athleteId);
  if ("error" in auth) return auth.error;
  const data = await rls(auth.user)((tx) => setDayNote(tx, athleteId, date, note));
  return NextResponse.json({ data });
}
