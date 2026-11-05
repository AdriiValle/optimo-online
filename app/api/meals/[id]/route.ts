import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { mealForUser } from "@/lib/access";
import { notFound, unauthenticated } from "@/lib/errors";
import { deleteMealSlot } from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return notFound();
  if (!(await mealForUser(user, id))) return notFound();
  const ok = await withRls(rlsFrom(user), (tx) => deleteMealSlot(tx, id));
  if (!ok) return notFound();
  return NextResponse.json({ data: { ok: true } });
}
