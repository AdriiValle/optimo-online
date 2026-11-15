import { notFound } from "@/lib/errors";
import { dishPhotoFor } from "@/lib/nutrition/templates-queries";
import { authorizeEditor, rls, Uuid } from "../../../shared";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!Uuid.safeParse(id).success) return notFound();
  const auth = await authorizeEditor();
  if ("error" in auth) return auth.error;
  const photo = await rls(auth.user)((tx) => dishPhotoFor(tx, id));
  if (!photo) return notFound();
  return new Response(new Uint8Array(photo.bytes), {
    headers: { "Content-Type": photo.mime, "Cache-Control": "private, max-age=86400" }
  });
}
