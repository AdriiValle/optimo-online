import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import {
  importableWeeks,
  isDocxUpload,
  isPdfUpload,
  mealsFromImportWeeks,
  MENU_DOCX_MAX_BYTES,
  parseWordMenuTables
} from "@/lib/menu-import/parse-word-menu";
import { upsertMealSlot } from "@/lib/queries";
import { generateMealItemDrafts, type DraftSummary } from "@/lib/nutrition/generate-drafts";
import { addDays, dateKey, parseDateLocal } from "@/lib/dates";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();

  const form = await req.formData().catch(() => null);
  if (!form) return apiError(422, "VALIDATION_ERROR", "Formulario inválido");

  const athleteId = form.get("athleteId");
  const weekStart = form.get("weekStart");
  const file = form.get("file");
  const withItems = form.get("withItems") === "1";

  if (typeof athleteId !== "string" || !z.string().uuid().safeParse(athleteId).success) {
    return apiError(422, "VALIDATION_ERROR", "Deportista inválido");
  }
  if (typeof weekStart !== "string" || !IsoDate.safeParse(weekStart).success) {
    return apiError(422, "VALIDATION_ERROR", "Indica el lunes de inicio (AAAA-MM-DD)");
  }
  if (!(file instanceof File) || !file.size) {
    return apiError(422, "VALIDATION_ERROR", "Falta el archivo Word");
  }

  if (isPdfUpload(file)) {
    return apiError(
      422,
      "VALIDATION_ERROR",
      "En esta versión solo se importan menús en Word (.docx). Guarda el menú como .docx y vuelve a subirlo."
    );
  }
  if (!isDocxUpload(file)) {
    return apiError(422, "VALIDATION_ERROR", "Sube un archivo .docx (Word).");
  }
  if (file.size > MENU_DOCX_MAX_BYTES) {
    return apiError(422, "PAYLOAD_TOO_LARGE", "El archivo supera 5 MB.");
  }

  if (!(await canSeeAthleteNutrition(user, athleteId))) return notFound();

  const bytes = Buffer.from(await file.arrayBuffer());
  let blocks;
  try {
    blocks = await parseWordMenuTables(bytes);
  } catch {
    return apiError(422, "VALIDATION_ERROR", "No se pudo leer el Word. Comprueba que sea un .docx con tablas de menú.");
  }

  const weeks = importableWeeks(blocks);
  if (!weeks.length) {
    return apiError(
      422,
      "VALIDATION_ERROR",
      "No hay semanas de menú para importar (solo plantillas o tablas vacías)."
    );
  }

  let rows;
  try {
    rows = mealsFromImportWeeks(weeks, weekStart);
  } catch (e) {
    if (e instanceof Error && e.message === "WEEK_START_NOT_MONDAY") {
      return apiError(422, "VALIDATION_ERROR", "La semana de inicio debe ser un lunes.");
    }
    throw e;
  }

  const { written, drafts } = await withRls(rlsFrom(user), async (tx) => {
    const ids: string[] = [];
    for (const row of rows) {
      const meal = await upsertMealSlot(tx, athleteId, row.date, row.slot, row.title, row.preparation);
      if (meal) ids.push(meal.id);
    }
    // Paso opcional: borradores de ingredientes solo para los platos cuyo texto cambió.
    const drafts: DraftSummary | null = withItems ? await generateMealItemDrafts(tx, athleteId, { ids }) : null;
    return { written: rows.length, drafts };
  });

  const weekStarts = weeks.map((_, i) => dateKey(addDays(parseDateLocal(weekStart), i * 7)));

  return NextResponse.json({
    data: {
      weeksImported: weeks.length,
      slotsWritten: written,
      blocksInDoc: blocks.length,
      blocksSkipped: blocks.length - weeks.length,
      weekStarts,
      ...(drafts ? { drafts } : {})
    }
  });
}
