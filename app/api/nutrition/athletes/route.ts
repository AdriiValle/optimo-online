import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { notFound, unauthenticated } from "@/lib/errors";
import { assignedAthletesForNutritionist } from "@/lib/queries";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "nutritionist") return notFound();

  const data = await withRls(rlsFrom(user), (tx) => assignedAthletesForNutritionist(tx, user.id));
  return NextResponse.json({ data });
}
