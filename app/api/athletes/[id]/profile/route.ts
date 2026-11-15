import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { athleteProfile, foodsForDrafts, updateAthleteProfile, type AthleteProfilePatch } from "@/lib/queries";
import { DAY_TYPES, OVERRIDE_MAX, TARGET_KEYS, type TargetOverrides } from "@/lib/nutrition/targets";
import { allergenFoods, profileTerms } from "@/app/nutricion/[athleteId]/perfil/allergy-match";

const Term = z.string().trim().min(1).max(60);
const Terms = z.array(Term).max(30);
const DayValues = z.object(Object.fromEntries(DAY_TYPES.map((d) => [d, z.number().positive().optional()]))).strict();
const Overrides = z
  .object(Object.fromEntries(TARGET_KEYS.map((k) => [k, DayValues.optional()])))
  .strict()
  .superRefine((o, ctx) => {
    for (const [k, days] of Object.entries(o as Record<string, Record<string, number | undefined> | undefined>)) {
      for (const [d, v] of Object.entries(days ?? {})) {
        if (v !== undefined && v > OVERRIDE_MAX[k as keyof typeof OVERRIDE_MAX]) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [k, d], message: "Fuera de rango" });
        }
      }
    }
  });

const Schema = z
  .object({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    heightCm: z.number().min(100).max(250).nullable().optional(),
    weightKg: z.number().min(25).max(250).nullable().optional(),
    allergies: Terms.optional(),
    intolerances: Terms.optional(),
    showNumbers: z.boolean().optional(),
    dietGoal: z.string().trim().max(120).nullable().optional(),
    targetOverrides: Overrides.nullable().optional()
  })
  .refine(
    (p) => {
      const body = [p.birthDate, p.heightCm, p.weightKg].filter((v) => v !== undefined).length;
      return body === 0 || body === 3;
    },
    { message: "Nacimiento, altura y peso van juntos" }
  )
  .refine((p) => Object.values(p).some((v) => v !== undefined), { message: "Nada que guardar" });

const NOT_SAVED = Symbol("not-saved");

type Ctx = { params: Promise<{ id: string }> };

async function authorize(athleteId: string) {
  const user = await currentUser();
  if (!user) return { error: unauthenticated() } as const;
  if (user.role !== "admin" && user.role !== "nutritionist") return { error: notFound() } as const;
  if (!(await canSeeAthleteNutrition(user, athleteId))) return { error: notFound() } as const;
  return { user } as const;
}

/** Quita duplicados (sin distinguir mayúsculas ni acentos) y conserva el orden. */
function uniqueTerms(list: string[]) {
  const seen = new Set<string>();
  return list.filter((t) => {
    const k = t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Perfil + alimentos del catálogo que casan con sus alergias/intolerancias (por nombre o alias). */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if ("error" in auth) return auth.error;
  const data = await withRls(rlsFrom(auth.user), async (tx) => {
    const profile = await athleteProfile(tx, id);
    if (!profile) return null;
    const terms = profileTerms(profile.allergies, profile.intolerances);
    return { ...profile, allergenFoods: terms.length ? allergenFoods(await foodsForDrafts(tx), terms) : [] };
  });
  if (!data) return notFound();
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if ("error" in auth) return auth.error;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const p = parsed.data;

  const patch: AthleteProfilePatch = {};
  if (p.birthDate !== undefined && p.heightCm !== undefined && p.weightKg !== undefined) {
    patch.body = { birthDate: p.birthDate, heightCm: p.heightCm, weightKg: p.weightKg };
  }
  const diet: NonNullable<AthleteProfilePatch["diet"]> = {};
  if (p.allergies) diet.allergies = uniqueTerms(p.allergies);
  if (p.intolerances) diet.intolerances = uniqueTerms(p.intolerances);
  if (p.showNumbers !== undefined) diet.showNumbers = p.showNumbers;
  if (p.dietGoal !== undefined) diet.dietGoal = p.dietGoal || null;
  if (p.targetOverrides !== undefined) {
    const o = (p.targetOverrides ?? {}) as TargetOverrides;
    diet.targetOverrides = Object.values(o).some((d) => d && Object.keys(d).length) ? o : null;
  }
  if (Object.keys(diet).length) patch.diet = diet;

  // Si una parte no se guarda, se lanza para deshacer la transacción entera (nunca medio perfil).
  const data = await withRls(rlsFrom(auth.user), async (tx) => {
    if (!(await updateAthleteProfile(tx, id, patch, auth.user.role === "nutritionist"))) throw NOT_SAVED;
    return athleteProfile(tx, id);
  }).catch((e) => {
    if (e === NOT_SAVED) return null;
    throw e;
  });
  if (!data) return notFound();
  return NextResponse.json({ data });
}
