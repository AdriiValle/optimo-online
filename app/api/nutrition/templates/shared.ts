import { z } from "zod";
import type { Tx } from "@/lib/db";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { notFound, unauthenticated } from "@/lib/errors";
import type { SessionUser } from "@/lib/types";

export const Uuid = z.string().uuid();
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Plantillas, platos y sustituciones: catálogos de la nutricionista (y admin). La conexión tiene BYPASSRLS:
 * el rol se comprueba aquí y, cuando la operación toca el menú de un deportista, también su asignación.
 */
export async function authorizeEditor(athleteId?: string) {
  const user = await currentUser();
  if (!user) return { error: unauthenticated() } as const;
  if (user.role !== "admin" && user.role !== "nutritionist") return { error: notFound() } as const;
  if (athleteId && !(await canSeeAthleteNutrition(user, athleteId))) return { error: notFound() } as const;
  return { user } as const;
}

export function rls(user: SessionUser) {
  return <T,>(fn: (tx: Tx) => Promise<T>) => withRls(rlsFrom(user), fn);
}
