import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/errors";
import { listTemplates, saveTemplateFromMenu } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, IsoDate, rls, Uuid } from "./shared";

export async function GET() {
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ data: await rls(auth.user)(listTemplates) });
}

const SaveBody = z.object({
  athleteId: Uuid,
  /** Día (plantilla de día) o lunes de la semana (plantilla de semana). */
  from: IsoDate,
  kind: z.enum(["day", "week"]),
  name: z.string().trim().min(1, "Pon un nombre").max(120),
  mdTag: z.string().trim().max(12).nullable()
});

/** Guarda un día o una semana del menú del deportista como plantilla (platos, fotos e ingredientes). */
export async function POST(req: Request) {
  const parsed = SaveBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const { athleteId, from, kind, name, mdTag } = parsed.data;
  const auth = await authorizeEditor(athleteId);
  if ("error" in auth) return auth.error;

  const result = await rls(auth.user)(async (tx) => {
    const id = await saveTemplateFromMenu(tx, { athleteId, from, kind, name, mdTag: mdTag || null, accountId: auth.user.id });
    return id ? { id, templates: await listTemplates(tx) } : null;
  });
  if (!result) return apiError(422, "VALIDATION_ERROR", kind === "week" ? "Esa semana no tiene platos" : "Ese día no tiene platos");
  return NextResponse.json({ data: result }, { status: 201 });
}
