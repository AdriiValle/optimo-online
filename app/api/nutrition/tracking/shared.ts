import { currentUser } from "@/lib/auth";
import { canSeeAthleteNutrition } from "@/lib/access";
import { notFound, unauthenticated } from "@/lib/errors";

/**
 * Seguimiento: solo panel de Amanda/admin, nunca el propio deportista (aunque `canSeeAthleteNutrition`
 * le deje ver su menú). La conexión tiene BYPASSRLS: el rol y la asignación se comprueban aquí.
 */
export async function authorizeTracking(athleteId: string) {
  const user = await currentUser();
  if (!user) return { error: unauthenticated() } as const;
  if (user.role !== "admin" && user.role !== "nutritionist") return { error: notFound() } as const;
  if (!(await canSeeAthleteNutrition(user, athleteId))) return { error: notFound() } as const;
  return { user } as const;
}
