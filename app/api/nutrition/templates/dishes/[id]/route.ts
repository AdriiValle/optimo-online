import { NextResponse } from "next/server";
import { notFound } from "@/lib/errors";
import { deleteDish } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, rls, Uuid } from "../../shared";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!Uuid.safeParse(id).success) return notFound();
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  if (!(await rls(auth.user)((tx) => deleteDish(tx, id)))) return notFound();
  return NextResponse.json({ data: { id } });
}
