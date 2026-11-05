import { notFound } from "next/navigation";
import type { SessionUser } from "@/lib/types";
import { withRls } from "@/lib/rls";
import { isNutritionistAssigned, mealById } from "@/lib/queries";

/** Admin o el propio deportista. La nutricionista no pasa: diario, lesiones, perfil y wearables quedan fuera. */
export function canSeeAthlete(user: SessionUser, athleteId: string) {
  if (user.role === "admin") return true;
  return user.athleteId === athleteId;
}

function ctxOf(user: SessionUser) {
  return { role: user.role, accountId: user.id, athleteId: user.athleteId };
}

/**
 * Lectura de calendario/foto y escritura de menú + suplementos: admin, propio o nutricionista asignada.
 * Chequeo explícito en app: la conexión Neon actual tiene BYPASSRLS, las policies no bastan.
 */
export async function canSeeAthleteNutrition(user: SessionUser, athleteId: string) {
  if (canSeeAthlete(user, athleteId)) return true;
  if (user.role !== "nutritionist") return false;
  return withRls(ctxOf(user), (tx) => isNutritionistAssigned(tx, athleteId));
}

/** Plato visible para el usuario (por su deportista), o null. */
export async function mealForUser(user: SessionUser, mealId: string) {
  const meal = await withRls(ctxOf(user), (tx) => mealById(tx, mealId));
  if (!meal) return null;
  return (await canSeeAthleteNutrition(user, meal.athleteId)) ? meal : null;
}

export function assertAthleteAccess(user: SessionUser | null, athleteId: string) {
  if (!user || !canSeeAthlete(user, athleteId)) notFound();
}

export function assertAdmin(user: SessionUser | null) {
  if (!user || user.role !== "admin") notFound();
}
