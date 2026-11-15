import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/errors";
import { listSwaps, upsertSwap } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, rls, Uuid } from "../shared";

export async function GET() {
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ data: await rls(auth.user)(listSwaps) });
}

const Body = z
  .object({
    foodId: Uuid,
    swapFoodId: Uuid,
    /** Gramos del sustituto por gramo del original (120 g de pasta por 100 g de arroz → 1,2). */
    ratio: z.number().finite().min(0.05).max(20),
    reverse: z.boolean().default(false)
  })
  .refine((b) => b.foodId !== b.swapFoodId, { message: "Elige dos alimentos distintos", path: ["swapFoodId"] });

/** Aprueba una sustitución (o corrige su razón). */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "VALIDATION_ERROR", "Datos inválidos", parsed.error.flatten());
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  const data = await rls(auth.user)(async (tx) => {
    const known = await tx<{ n: number }[]>`
      select count(*)::int as n from foods where id in (${parsed.data.foodId}, ${parsed.data.swapFoodId})
    `;
    if (known[0]?.n !== 2) return null;
    await upsertSwap(tx, { ...parsed.data, accountId: auth.user.id });
    return listSwaps(tx);
  });
  if (!data) return apiError(422, "VALIDATION_ERROR", "Alimento desconocido");
  return NextResponse.json({ data }, { status: 201 });
}
