import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import type { Tx } from "@/lib/db";
import { listFoods, orphanGroups } from "@/lib/nutrition/foods-queries";

/** Catálogo global: lo editan la nutricionista y el admin (RLS `foods_write`). */
export async function foodsEditor() {
  const user = await currentUser();
  if (!user) return { user: null, allowed: false } as const;
  return { user, allowed: user.role === "nutritionist" || user.role === "admin" } as const;
}

export function rls(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return <T>(fn: (tx: Tx) => Promise<T>) => withRls(rlsFrom(user), fn);
}

/** Estado completo de la pantalla Alimentos: catálogo + bandeja «Sin alimento». */
export async function foodsState(tx: Tx) {
  const [foods, orphans] = await Promise.all([listFoods(tx), orphanGroups(tx)]);
  return { foods, orphans };
}

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v ? v : null));

const optGrams = z.number().positive().max(100000).nullable().optional();

export const FoodFields = z.object({
  name: z.string().trim().min(1, "Pon un nombre").max(80),
  aliases: z.array(z.string().trim().max(80)).max(40).optional(),
  aisle: optText(40),
  unitName: optText(24),
  unitG: optGrams,
  packG: optGrams,
  staple: z.boolean().optional()
});

/** Violación de `foods.name_es UNIQUE`. */
export function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}
