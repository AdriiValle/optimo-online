import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthlete } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { athleteById, photoFor } from "@/lib/queries";
import { PHOTO_MAX_BYTES, PHOTO_MIME } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  const { id } = await params;
  if (!canSeeAthlete(user, id)) return notFound();

  const photo = await withRls(rlsFrom(user), (tx) => photoFor(tx, id));
  if (!photo) return notFound();
  return new Response(photo.bytes, {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, no-store"
    }
  });
}

export async function POST(req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  const { id } = await params;
  if (!canSeeAthlete(user, id)) return notFound();

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

  const athlete = await withRls(rlsFrom(user), async (tx) => {
    const found = await athleteById(tx, id);
    if (!found) return null;
    await tx`
      update athletes
      set photo_bytes = ${buf}, photo_mime = ${mime}
      where id = ${id}
    `;
    return found;
  });
  if (!athlete) return notFound();
  return Response.json({ data: { ok: true } });
}
