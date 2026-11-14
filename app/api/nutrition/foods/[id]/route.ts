import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { aliasOwner, foodById, updateFood } from "@/lib/nutrition/foods-queries";
import { normalizeFoodText } from "@/lib/nutrition/parse-dish";
import { FoodFields, foodsEditor, isUniqueViolation, rls } from "../shared";

const Patch = FoodFields.partial().refine((p) => Object.keys(p).length > 0, "Nada que cambiar");

class AliasTaken extends Error {
  constructor(readonly alias: string, readonly owner: string) {
    super("alias");
  }
}

/** Edita un alimento del catálogo (nombre, sección, unidad, g/unidad, alias, básico). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, allowed } = await foodsEditor();
  if (!user) return unauthenticated();
  if (!allowed) return notFound();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return notFound();

  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());

  try {
    const food = await rls(user)(async (tx) => {
      const current = await foodById(tx, id);
      if (!current) return null;
      const added = [
        ...(parsed.data.name && parsed.data.name !== current.name ? [parsed.data.name] : []),
        ...(parsed.data.aliases ?? []).filter((a) => !current.aliases.includes(normalizeFoodText(a)))
      ];
      for (const a of added) {
        const owner = await aliasOwner(tx, a, id);
        if (owner) throw new AliasTaken(a, owner.name);
      }
      await updateFood(tx, id, parsed.data);
      return foodById(tx, id);
    });
    if (!food) return notFound();
    return NextResponse.json({ data: food });
  } catch (e) {
    if (e instanceof AliasTaken) return apiError(409, "CONFLICT", `«${e.alias}» ya es de «${e.owner}»`);
    if (isUniqueViolation(e)) return apiError(409, "CONFLICT", "Ya hay un alimento con ese nombre");
    throw e;
  }
}
