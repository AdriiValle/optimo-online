import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { polarConfig } from "@/lib/integrations/config";
import {
  polarExchangeCode,
  polarRegisterUser,
  tokenExpiresAt
} from "@/lib/integrations/polar";
import { saveIntegrationTokens, upsertIntegrationStatus } from "@/lib/integrations/store";

const COOKIE = "polar_oauth";

function redirectAthlete(athleteId: string, device: "ok" | "error", message?: string) {
  const base = process.env.AUTH_URL?.replace(/\/$/, "") ?? "";
  const q = new URLSearchParams({ pane: "log", device });
  if (message) q.set("deviceMsg", message.slice(0, 120));
  return NextResponse.redirect(`${base}/a/${athleteId}?${q.toString()}`);
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "athlete" || !user.athleteId) {
    return NextResponse.redirect("/login");
  }

  const cfg = polarConfig();
  if (!cfg) {
    return NextResponse.redirect(`/a/${user.athleteId}?pane=log&device=error&deviceMsg=Polar+no+configurado`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  jar.delete(COOKIE);

  if (!code || !state || !raw) {
    return redirectAthlete(user.athleteId, "error", "Sesión OAuth inválida");
  }

  const [cookieState, athleteId] = raw.split(":");
  if (cookieState !== state || athleteId !== user.athleteId) {
    return redirectAthlete(user.athleteId, "error", "Estado OAuth no coincide");
  }

  try {
    const token = await polarExchangeCode(cfg, code);
    await polarRegisterUser(token.access_token, athleteId);
    const expires = tokenExpiresAt(token.expires_in);
    const externalId = token.x_user_id != null ? String(token.x_user_id) : null;

    await withRls(rlsFrom(user), async (tx) => {
      await upsertIntegrationStatus(tx, athleteId, "polar", "connected", { lastError: null });
      await saveIntegrationTokens(
        tx,
        athleteId,
        "polar",
        {
          accessToken: token.access_token,
          refreshToken: "",
          tokenExpiresAt: expires,
          externalUserId: externalId
        },
        cfg
      );
    });

    return redirectAthlete(athleteId, "ok");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al conectar Polar";
    await withRls(rlsFrom(user), (tx) =>
      upsertIntegrationStatus(tx, athleteId, "polar", "error", { lastError: msg.slice(0, 400) })
    );
    return redirectAthlete(athleteId, "error", msg);
  }
}
