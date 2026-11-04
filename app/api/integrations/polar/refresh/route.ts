import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthlete } from "@/lib/access";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { diaryFor } from "@/lib/queries";
import { polarConfig } from "@/lib/integrations/config";
import { polarFetchDayData } from "@/lib/integrations/polar";
import { applyDeviceDiaryPatch, upsertDeviceWorkouts } from "@/lib/integrations/sync-diary";
import { loadIntegrationTokens, upsertIntegrationStatus } from "@/lib/integrations/store";

const BodySchema = z.object({
  athleteId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();

  const cfg = polarConfig();
  if (!cfg) {
    return apiError(503, "INTEGRATION_NOT_CONFIGURED", "Polar integration is not configured");
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid body", parsed.error.flatten());
  }
  if (!canSeeAthlete(user, parsed.data.athleteId)) return notFound();
  if (user.role === "athlete" && user.athleteId !== parsed.data.athleteId) return notFound();

  const { athleteId, date } = parsed.data;

  try {
    const result = await withRls(rlsFrom(user), async (tx) => {
      const statusRows = await tx<{ status: string }[]>`
        select status from integrations
        where athlete_id = ${athleteId} and provider = 'polar'
        limit 1
      `;
      if (statusRows[0]?.status !== "connected") {
        return { kind: "not_connected" as const };
      }

      const tokens = await loadIntegrationTokens(tx, athleteId, "polar", cfg);
      if (!tokens) return { kind: "not_connected" as const };

      const remote = await polarFetchDayData(tokens.accessToken, date);
      if (!remote.hasDiaryData && remote.workoutsCount === 0) {
        await upsertIntegrationStatus(tx, athleteId, "polar", "connected", { lastSyncAt: new Date() });
        return { kind: "no_data" as const };
      }

      if (remote.diaryPatch) {
        await applyDeviceDiaryPatch(tx, athleteId, date, "polar", remote.diaryPatch);
      }
      if (remote.workouts.length) {
        await upsertDeviceWorkouts(tx, athleteId, date, "polar", remote.workouts);
      }

      await upsertIntegrationStatus(tx, athleteId, "polar", "connected", {
        lastSyncAt: new Date(),
        lastError: null
      });

      const diary = await diaryFor(tx, athleteId, date);
      return {
        kind: "ok" as const,
        synced: true,
        workouts: remote.workoutsCount,
        diary
      };
    });

    if (result.kind === "not_connected") {
      return apiError(409, "CONFLICT", "Polar is not connected");
    }
    if (result.kind === "no_data") {
      return NextResponse.json({ data: { synced: false, reason: "NO_DATA" } });
    }
    return NextResponse.json({
      data: { synced: true, workouts: result.workouts, diary: result.diary }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Polar sync failed";
    const isAuth = /401|403/.test(msg);
    await withRls(rlsFrom(user), (tx) =>
      upsertIntegrationStatus(tx, athleteId, "polar", "error", { lastError: msg.slice(0, 400) })
    );
    if (isAuth) {
      return apiError(409, "CONFLICT", "Polar authorization expired; reconnect");
    }
    return apiError(502, "VALIDATION_ERROR", msg.slice(0, 200));
  }
}
