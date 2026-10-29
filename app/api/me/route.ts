import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { notFound, unauthenticated } from "@/lib/errors";
import { athleteByAccountId } from "@/lib/queries";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "athlete" || !user.athleteId) return notFound();

  const athlete = await withRls(rlsFrom(user), (tx) => athleteByAccountId(tx, user.id));
  if (!athlete) return notFound();

  return NextResponse.json({
    data: {
      email: user.email,
      name: athlete.name,
      athleteId: athlete.id,
      hasPhoto: athlete.hasPhoto
    }
  });
}
