import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { mealForUser } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { clearMealPhoto, mealPhotoFor, setMealPhoto } from "@/lib/queries";
import { PHOTO_MAX_BYTES, PHOTO_MIME } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

const Id = z.string().uuid();

export async function GET(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  const { id } = await params;
  if (!Id.safeParse(id).success) return notFound();
  if (!(await mealForUser(user, id))) return notFound();

  const photo = await withRls(rlsFrom(user), (tx) => mealPhotoFor(tx, id));
  if (!photo) return notFound();
  return new Response(photo.bytes, {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=86400"
    }
  });
}

export async function POST(req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();
  const { id } = await params;
  if (!Id.safeParse(id).success) return notFound();
  if (!(await mealForUser(user, id))) return notFound();

  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) {
    return apiError(422, "VALIDATION_ERROR", "photo required");
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return apiError(422, "PAYLOAD_TOO_LARGE", "Photo must be 400 KB or less");
  }
  const mime = file.type || "application/octet-stream";
  if (!PHOTO_MIME.has(mime)) {
    return apiError(422, "VALIDATION_ERROR", "Unsupported image type");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > PHOTO_MAX_BYTES) {
    return apiError(422, "PAYLOAD_TOO_LARGE", "Photo must be 400 KB or less");
  }

  // `applyToSame=1`: también a los platos iguales del deportista sin foto (nunca pisa una existente).
  const applyToSame = form?.get("applyToSame") === "1";
  const updated = await withRls(rlsFrom(user), (tx) => setMealPhoto(tx, id, buf, mime, applyToSame));
  if (!updated.length) return notFound();
  return Response.json({ data: { updated } });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin" && user.role !== "nutritionist") return notFound();
  const { id } = await params;
  if (!Id.safeParse(id).success) return notFound();
  if (!(await mealForUser(user, id))) return notFound();

  const updatedAt = await withRls(rlsFrom(user), (tx) => clearMealPhoto(tx, id));
  if (!updatedAt) return notFound();
  return Response.json({ data: { id, updatedAt } });
}
