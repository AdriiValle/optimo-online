"use server";

import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { nutritionToday } from "@/lib/nutrition/today-queries";
import type { TodayData } from "@/lib/nutrition/today";
import { shoppingRange } from "@/lib/nutrition/shopping";
import { setShoppingCheck, shoppingForRange, type ShoppingData } from "@/lib/nutrition/shopping-queries";
import { nutritionWeek, type WeekData } from "./week-queries";
import { swapsForDay, type IngredientSwaps } from "@/lib/nutrition/templates-queries";
import {
  checkableSlot,
  clearMealCheck,
  mealChecksForDay,
  setMealCheckDetails,
  setMealCheckStatus
} from "@/lib/nutrition/checks-queries";
import { PHOTO_MAX_BYTES, PHOTO_MIME } from "@/lib/constants";
import type { MealCheck, MealCheckStatus, SessionUser } from "@/lib/types";

const Input = z.object({
  athleteId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

/**
 * Vista «Hoy» del jugador. Va como Server Action (POST a /a/[id]) y no bajo /api/nutrition:
 * el middleware reserva /api/nutrition/* a la nutricionista. El jugador solo ve lo suyo;
 * el admin, el de cualquier deportista; la nutricionista no llega a /a/ (middleware).
 */
export async function loadNutritionToday(athleteId: string, date: string): Promise<TodayData | null> {
  const parsed = Input.safeParse({ athleteId, date });
  if (!parsed.success) return null;
  const user = await currentUser();
  if (!user) return null;
  if (!(await canSeeAthleteNutrition(user, parsed.data.athleteId))) return null;
  return withRls(rlsFrom(user), (tx) => nutritionToday(tx, parsed.data.athleteId, parsed.data.date));
}

/** Sustituciones aprobadas por Amanda para los ingredientes del día, por plato. Mismo acceso que «Hoy». */
export async function loadMealSwaps(athleteId: string, date: string): Promise<Record<string, IngredientSwaps[]> | null> {
  const parsed = Input.safeParse({ athleteId, date });
  if (!parsed.success) return null;
  const user = await currentUser();
  if (!user) return null;
  if (!(await canSeeAthleteNutrition(user, parsed.data.athleteId))) return null;
  return withRls(rlsFrom(user), (tx) => swapsForDay(tx, parsed.data.athleteId, parsed.data.date));
}

/** Vista «Semana» del jugador: lunes a domingo que empieza en `weekStart`. Mismo acceso que «Hoy». */
export async function loadNutritionWeek(athleteId: string, weekStart: string): Promise<WeekData | null> {
  const parsed = Input.safeParse({ athleteId, date: weekStart });
  if (!parsed.success) return null;
  const user = await currentUser();
  if (!user) return null;
  if (!(await canSeeAthleteNutrition(user, parsed.data.athleteId))) return null;
  return withRls(rlsFrom(user), (tx) => nutritionWeek(tx, parsed.data.athleteId, parsed.data.date));
}

const ShoppingInputSchema = z.object({
  athleteId: z.string().uuid(),
  kind: z.enum(["week", "3d"]),
  anchor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

/** Vista «Compra» del jugador: semana de `anchor` o `anchor` + 2 días. Mismo acceso que «Hoy». */
export async function loadNutritionShopping(athleteId: string, kind: "week" | "3d", anchor: string): Promise<ShoppingData | null> {
  const parsed = ShoppingInputSchema.safeParse({ athleteId, kind, anchor });
  if (!parsed.success) return null;
  const user = await currentUser();
  if (!user) return null;
  if (!(await canSeeAthleteNutrition(user, parsed.data.athleteId))) return null;
  const range = shoppingRange(parsed.data.kind, parsed.data.anchor);
  return withRls(rlsFrom(user), (tx) => shoppingForRange(tx, parsed.data.athleteId, range));
}

const CheckInput = z.object({
  athleteId: z.string().uuid(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  foodKey: z.string().min(1).max(200),
  checked: z.boolean()
});

/** «Ya lo tengo» de una línea de la compra. Devuelve el estado guardado, o null si no se pudo. */
export async function saveNutritionShoppingCheck(athleteId: string, weekStart: string, foodKey: string, checked: boolean): Promise<boolean | null> {
  const parsed = CheckInput.safeParse({ athleteId, weekStart, foodKey, checked });
  if (!parsed.success) return null;
  const user = await currentUser();
  if (!user) return null;
  if (!(await canSeeAthleteNutrition(user, parsed.data.athleteId))) return null;
  const d = parsed.data;
  return withRls(rlsFrom(user), (tx) => setShoppingCheck(tx, d.athleteId, d.weekStart, d.foodKey, d.checked));
}

// —— Check de comidas (meal_checks) ——
// También por Server Action y no bajo /api/nutrition/checks: el middleware reserva /api/nutrition/* a la
// nutricionista y el que marca es el jugador. La foto se sirve en ./check-photo/[slotId] (GET).

export type MealChecksData = {
  /** Solo el propio jugador marca sus franjas; el admin ve la vista sin los botones. */
  canCheck: boolean;
  checks: MealCheck[];
};

/** Checks del día que se está viendo en «Hoy». */
export async function loadMealChecks(athleteId: string, date: string): Promise<MealChecksData | null> {
  const parsed = Input.safeParse({ athleteId, date });
  if (!parsed.success) return null;
  const user = await currentUser();
  if (!user) return null;
  if (!(await canSeeAthleteNutrition(user, parsed.data.athleteId))) return null;
  const checks = await withRls(rlsFrom(user), (tx) => mealChecksForDay(tx, parsed.data.athleteId, parsed.data.date));
  return { canCheck: isOwner(user, parsed.data.athleteId), checks };
}

function isOwner(user: SessionUser, athleteId: string) {
  return user.role === "athlete" && user.athleteId === athleteId;
}

const SlotInput = z.object({ athleteId: z.string().uuid(), slotId: z.string().uuid() });
const StatusInput = z.enum(["done", "half", "missed"]).nullable();

/** Jugador dueño de la franja (y franja no futura), o null. */
async function ownSlot(athleteId: unknown, slotId: unknown) {
  const parsed = SlotInput.safeParse({ athleteId, slotId });
  if (!parsed.success) return null;
  const user = await currentUser();
  if (!user || !isOwner(user, parsed.data.athleteId)) return null;
  const date = await withRls(rlsFrom(user), (tx) => checkableSlot(tx, parsed.data.slotId, parsed.data.athleteId));
  return date ? { user, ...parsed.data } : null;
}

/** Un toque: Hecho / A medias / No; `null` quita la marca (y su comentario y foto). */
export async function saveMealCheckStatus(
  athleteId: string,
  slotId: string,
  status: MealCheckStatus | null
): Promise<{ ok: true; check: MealCheck | null } | { ok: false }> {
  const s = StatusInput.safeParse(status);
  if (!s.success) return { ok: false };
  const own = await ownSlot(athleteId, slotId);
  if (!own) return { ok: false };
  if (s.data === null) {
    await withRls(rlsFrom(own.user), (tx) => clearMealCheck(tx, own.slotId));
    return { ok: true, check: null };
  }
  const st = s.data;
  const check = await withRls(rlsFrom(own.user), (tx) => setMealCheckStatus(tx, own.slotId, st));
  return check ? { ok: true, check } : { ok: false };
}

/**
 * Comentario corto y foto del plato real (FormData: athleteId, slotId, note, photo?, removePhoto?).
 * La foto llega ya reducida en el navegador (lib/image-resize); aquí solo se valida tipo y tamaño.
 */
export async function saveMealCheckDetails(form: FormData): Promise<{ ok: true; check: MealCheck } | { ok: false; error: "photo" | "save" }> {
  const own = await ownSlot(form.get("athleteId"), form.get("slotId"));
  if (!own) return { ok: false, error: "save" };
  const rawNote = form.get("note");
  const note = typeof rawNote === "string" ? rawNote.trim().slice(0, 280) || null : null;

  let photo: { bytes: Buffer; mime: string } | null | undefined;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (file.size > PHOTO_MAX_BYTES || !PHOTO_MIME.has(file.type)) return { ok: false, error: "photo" };
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > PHOTO_MAX_BYTES) return { ok: false, error: "photo" };
    photo = { bytes, mime: file.type };
  } else if (form.get("removePhoto") === "1") {
    photo = null;
  }

  const check = await withRls(rlsFrom(own.user), (tx) => setMealCheckDetails(tx, own.slotId, note, photo));
  return check ? { ok: true, check } : { ok: false, error: "save" };
}
