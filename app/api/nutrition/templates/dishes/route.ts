import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound } from "@/lib/errors";
import { mealForUser } from "@/lib/access";
import { listDishes, saveDishFromMeal } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, rls, Uuid } from "../shared";

/** Biblioteca de platos; `q` filtra por nombre o preparación («buscar en mis platos»). */
export async function GET(req: Request) {
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 80);
  const limit = q.trim() ? 20 : 300;
  return NextResponse.json({ data: await rls(auth.user)((tx) => listDishes(tx, q, limit)) });
}

const SaveBody = z.object({ mealSlotId: Uuid });

/** Guarda un plato del menú en la biblioteca (o actualiza el de mismo nombre). */
export async function POST(req: Request) {
  const parsed = SaveBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  if (!(await mealForUser(auth.user, parsed.data.mealSlotId))) return notFound();
  const data = await rls(auth.user)((tx) => saveDishFromMeal(tx, parsed.data.mealSlotId, auth.user.id));
  if (!data) return notFound();
  return NextResponse.json({ data }, { status: data.updated ? 200 : 201 });
}
