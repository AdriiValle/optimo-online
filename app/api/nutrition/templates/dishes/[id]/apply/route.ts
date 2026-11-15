import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound } from "@/lib/errors";
import { MEAL_SLOT_KINDS } from "@/lib/types";
import { applyDish } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, IsoDate, rls, Uuid } from "../../../shared";

type Params = { params: Promise<{ id: string }> };

const Body = z.object({ athleteId: Uuid, date: IsoDate, slot: z.enum(MEAL_SLOT_KINDS) });

/** Pone el plato de la biblioteca en una franja del menú (texto, foto e ingredientes). */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  if (!Uuid.safeParse(id).success) return notFound();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const auth = await authorizeEditor(parsed.data.athleteId);
  if ("error" in auth) return auth.error;
  const meal = await rls(auth.user)((tx) => applyDish(tx, { dishId: id, ...parsed.data }));
  if (!meal) return notFound();
  return NextResponse.json({ data: meal });
}
