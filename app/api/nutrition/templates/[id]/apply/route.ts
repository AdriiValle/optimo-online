import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, notFound } from "@/lib/errors";
import { parseDateLocal } from "@/lib/dates";
import { applyTemplate, templateKind } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, IsoDate, rls, Uuid } from "../../shared";

type Params = { params: Promise<{ id: string }> };

const Body = z.object({ athleteId: Uuid, start: IsoDate, overwrite: z.boolean().default(false) });

/** Aplica la plantilla al menú del deportista desde `start` (lunes si es de semana). */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  if (!Uuid.safeParse(id).success) return notFound();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const { athleteId, start, overwrite } = parsed.data;
  const auth = await authorizeEditor(athleteId);
  if ("error" in auth) return auth.error;

  const data = await rls(auth.user)(async (tx) => {
    const kind = await templateKind(tx, id);
    if (!kind) return null;
    if (kind === "week" && parseDateLocal(start).getDay() !== 1) return "not-monday" as const;
    return applyTemplate(tx, { templateId: id, athleteId, start, overwrite });
  });
  if (!data) return notFound();
  if (data === "not-monday") return apiError(422, "VALIDATION_ERROR", "Una plantilla de semana empieza en lunes");
  return NextResponse.json({ data });
}
