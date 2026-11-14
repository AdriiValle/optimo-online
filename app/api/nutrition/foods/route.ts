import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { aliasFromText, aliasOwner, createFood, matchOrphansByKey, orphanGroupByKey } from "@/lib/nutrition/foods-queries";
import { FoodFields, foodsEditor, foodsState, isUniqueViolation, rls } from "./shared";

/** Catálogo de alimentos + bandeja «Sin alimento» (items de plato huérfanos agrupados por texto). */
export async function GET() {
  const { user, allowed } = await foodsEditor();
  if (!user) return unauthenticated();
  if (!allowed) return notFound();
  return NextResponse.json({ data: await rls(user)(foodsState) });
}

const CreateBody = FoodFields.extend({
  /** Grupo de la bandeja que da origen al alimento: su texto pasa a alias y sus items se emparejan. */
  matchKey: z.string().trim().min(1).max(400).optional()
});

class GroupGone extends Error {}

class AliasTaken extends Error {
  constructor(readonly owner: string) {
    super("alias");
  }
}

/** Alimento nuevo (fila manual). Con `matchKey`, re-empareja los items huérfanos con ese texto. */
export async function POST(req: Request) {
  const { user, allowed } = await foodsEditor();
  if (!user) return unauthenticated();
  if (!allowed) return notFound();

  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const { matchKey, ...f } = parsed.data;

  try {
    const data = await rls(user)(async (tx) => {
      const group = matchKey ? await orphanGroupByKey(tx, matchKey) : null;
      if (matchKey && !group) throw new GroupGone();
      const aliases = [...(f.aliases ?? []), ...(group ? [aliasFromText(group.text)] : [])];
      for (const a of [f.name, ...aliases]) {
        const owner = await aliasOwner(tx, a);
        if (owner) throw new AliasTaken(owner.name);
      }
      const id = await createFood(tx, {
        name: f.name,
        aliases,
        aisle: f.aisle ?? null,
        unitName: f.unitName ?? null,
        unitG: f.unitG ?? null,
        packG: f.packG ?? null,
        staple: f.staple ?? false
      });
      const matched = matchKey ? ((await matchOrphansByKey(tx, matchKey, id)) ?? 0) : 0;
      return { id, matched, ...(await foodsState(tx)) };
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    if (e instanceof AliasTaken) return apiError(409, "CONFLICT", `Ese nombre ya lo usa «${e.owner}»: elige «es alias de» ese alimento`);
    if (e instanceof GroupGone) return apiError(409, "CONFLICT", "Esos ingredientes ya no están sin alimento: recarga la bandeja");
    if (isUniqueViolation(e)) return apiError(409, "CONFLICT", "Ya hay un alimento con ese nombre");
    throw e;
  }
}
