import { z } from "zod";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { accountEmailTaken, createNutritionistAccount, nutritionistsList } from "@/lib/queries";
import { UsernameSchema } from "@/lib/username";

const CreateSchema = z.object({
  username: UsernameSchema,
  password: z.string().min(8).max(200)
});

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const data = await withRls(rlsFrom(user), (tx) => nutritionistsList(tx));
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid nutritionist", parsed.error.flatten());
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  const created = await withRls(rlsFrom(user), async (tx) => {
    if (await accountEmailTaken(tx, parsed.data.username)) return null;
    return createNutritionistAccount(tx, parsed.data.username, hash);
  });
  if (!created) return apiError(409, "CONFLICT", "Username already exists");
  return NextResponse.json(
    { data: { accountId: created.id, email: created.email, athleteIds: [] } },
    { status: 201 }
  );
}
