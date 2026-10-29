import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { notFound, unauthenticated } from "@/lib/errors";
import { adminAthleteAccounts } from "@/lib/queries";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const data = await withRls(rlsFrom(user), (tx) => adminAthleteAccounts(tx));
  return NextResponse.json({
    data,
    admin: { accountId: user.id, email: user.email }
  });
}
