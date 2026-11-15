import { NextResponse } from "next/server";
import { notFound } from "@/lib/errors";
import { deleteTemplate, listTemplates } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, rls, Uuid } from "../shared";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!Uuid.safeParse(id).success) return notFound();
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  const data = await rls(auth.user)(async (tx) => ((await deleteTemplate(tx, id)) ? listTemplates(tx) : null));
  if (!data) return notFound();
  return NextResponse.json({ data });
}
