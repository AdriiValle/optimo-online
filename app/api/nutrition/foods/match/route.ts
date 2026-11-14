import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { addFoodAlias, aliasFromText, aliasOwner, autoMatchOrphans, matchOrphansByKey, orphanGroupByKey } from "@/lib/nutrition/foods-queries";
import { foodsEditor, foodsState, rls } from "../shared";

const Body = z.union([
  z.object({
    /** Grupo de la bandeja (texto normalizado). */
    key: z.string().trim().min(1).max(400),
    foodId: z.string().uuid(),
    /** «Es alias de X»: el texto pasa a alias de X (y casará solo en los próximos menús). */
    addAlias: z.boolean()
  }),
  z.object({ auto: z.literal(true) })
]);

class GroupGone extends Error {}

class AliasTaken extends Error {
  constructor(readonly owner: string) {
    super("alias");
  }
}

/** Empareja huérfanos: un grupo con un alimento (y opcionalmente lo guarda como alias), o todo lo inequívoco. */
export async function POST(req: Request) {
  const { user, allowed } = await foodsEditor();
  if (!user) return unauthenticated();
  if (!allowed) return notFound();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const body = parsed.data;

  try {
    const data = await rls(user)(async (tx) => {
      if ("auto" in body) return { matched: await autoMatchOrphans(tx), ...(await foodsState(tx)) };
      const group = await orphanGroupByKey(tx, body.key);
      if (!group) throw new GroupGone();
      if (body.addAlias) {
        const alias = aliasFromText(group.text);
        const owner = alias ? await aliasOwner(tx, alias, body.foodId) : null;
        if (owner) throw new AliasTaken(owner.name);
        if (alias && !(await addFoodAlias(tx, body.foodId, alias))) return null;
      }
      const matched = await matchOrphansByKey(tx, body.key, body.foodId);
      if (matched === null) return null;
      return { matched, ...(await foodsState(tx)) };
    });
    if (!data) return apiError(422, "VALIDATION_ERROR", "Alimento desconocido");
    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof AliasTaken) return apiError(409, "CONFLICT", `Ese texto ya es alias de «${e.owner}»`);
    if (e instanceof GroupGone) return apiError(409, "CONFLICT", "Esos ingredientes ya no están sin alimento: recarga la bandeja");
    throw e;
  }
}
