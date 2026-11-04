import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthlete } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { polarConfig } from "@/lib/integrations/config";
import { polarAuthorizeUrl } from "@/lib/integrations/polar";
import { otherConnectedProvider } from "@/lib/integrations/store";

const QuerySchema = z.object({ athleteId: z.string().uuid() });

const COOKIE = "polar_oauth";
const COOKIE_MAX_AGE = 600;

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();

  const cfg = polarConfig();
  if (!cfg) {
    return apiError(503, "INTEGRATION_NOT_CONFIGURED", "Polar integration is not configured");
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ athleteId: url.searchParams.get("athleteId") });
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid query", parsed.error.flatten());
  }

  const { athleteId } = parsed.data;
  if (user.role !== "athlete" || user.athleteId !== athleteId) return notFound();
  if (!canSeeAthlete(user, athleteId)) return notFound();

  const blocked = await withRls(rlsFrom(user), (tx) => otherConnectedProvider(tx, athleteId, "polar"));
  if (blocked) {
    return apiError(409, "CONFLICT", "Another wearable is already connected");
  }

  const state = randomBytes(24).toString("hex");
  const jar = await cookies();
  jar.set(COOKIE, `${state}:${athleteId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/"
  });

  return NextResponse.redirect(polarAuthorizeUrl(cfg, state));
}
