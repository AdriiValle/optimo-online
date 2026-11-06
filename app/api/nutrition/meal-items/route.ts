import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { foodsForDrafts, mealItemsByIds, mealItemsForSlot, updateMealItem } from "@/lib/queries";

const ItemPatch = z
  .object({
    id: z.string().uuid(),
    foodId: z.string().uuid().nullable().optional(),
    grams: z.number().min(0).max(5000).nullable().optional(),
    role: z.enum(["veg", "protein", "carb", "fat", "other"]).optional(),
    confirmed: z.boolean().optional()
  })
  .refine((p) => Object.keys(p).length > 1, "Nada que cambiar");

const Body = z.object({ items: z.array(ItemPatch).min(1).max(100) });

/** Items de un plato (vigentes y obsoletos) + catálogo de alimentos para el editor. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();

  const mealSlotId = new URL(req.url).searchParams.get("mealSlotId");
  if (!z.string().uuid().safeParse(mealSlotId).success) return apiError(422, "VALIDATION_ERROR", "Plato inválido");

  const data = await withRls(rlsFrom(user), async (tx) => {
    const slot = await mealItemsForSlot(tx, mealSlotId!);
    if (!slot) return null;
    const foods = (await foodsForDrafts(tx)).map((f) => ({ id: f.id, name: f.name_es }));
    return { ...slot, foods };
  });
  if (!data || !(await canSeeAthleteNutrition(user, data.athleteId))) return notFound();
  return NextResponse.json({ data: { items: data.items, foods: data.foods } });
}

/** Edita y/o confirma items de plato. Cambiar alimento, gramos o rol los marca `origin='manual'`. */
export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const patches = parsed.data.items;
  const ids = [...new Set(patches.map((p) => p.id))];
  if (ids.length !== patches.length) return apiError(422, "VALIDATION_ERROR", "Item repetido");

  const ctx = rlsFrom(user);
  const current = await withRls(ctx, (tx) => mealItemsByIds(tx, ids));
  if (current.length !== ids.length) return notFound();
  for (const athleteId of new Set(current.map((it) => it.athleteId))) {
    if (!(await canSeeAthleteNutrition(user, athleteId))) return notFound();
  }

  const byId = new Map(current.map((it) => [it.id, it]));
  if (patches.some((p) => p.confirmed && byId.get(p.id)?.obsolete)) {
    return apiError(409, "CONFLICT", "El plato cambió desde que se generó este ingrediente: regenera los borradores");
  }

  const data = await withRls(ctx, async (tx) => {
    const foodIds = new Set((await foodsForDrafts(tx)).map((f) => f.id));
    const unknown = patches.find((p) => p.foodId && !foodIds.has(p.foodId));
    if (unknown) return null;
    for (const { id, ...patch } of patches) await updateMealItem(tx, id, patch);
    return mealItemsByIds(tx, ids);
  });
  if (!data) return apiError(422, "VALIDATION_ERROR", "Alimento desconocido");
  return NextResponse.json({ data });
}
