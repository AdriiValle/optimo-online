import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { mealForUser } from "@/lib/access";
import { notFound, unauthenticated } from "@/lib/errors";
import { sameDishWithoutPhotoCount } from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

/** Cuántos platos iguales (mismo deportista y texto) recibirían la foto con `applyToSame=1`. */
export async function GET(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return notFound();
  if (!(await mealForUser(user, id))) return notFound();

  const count = await withRls(rlsFrom(user), (tx) => sameDishWithoutPhotoCount(tx, id));
  return Response.json({ data: { count } });
}
