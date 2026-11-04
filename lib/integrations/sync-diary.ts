import type { Tx } from "@/lib/db";
import type { PolarDiaryPatch } from "@/lib/integrations/polar";
import { isDeviceField, type IntegrationProvider } from "@/lib/integrations/capabilities";

export async function applyDeviceDiaryPatch(
  tx: Tx,
  athleteId: string,
  date: string,
  provider: IntegrationProvider,
  patch: PolarDiaryPatch
) {
  const touchSleep = patch.sleepHours !== undefined && isDeviceField(provider, "sleepHours");
  const touchQuality = patch.sleepQuality !== undefined && isDeviceField(provider, "sleepQuality");
  const touchHrv = patch.hrv !== undefined && isDeviceField(provider, "hrv");
  const touchRhr = patch.restingHr !== undefined && isDeviceField(provider, "restingHr");

  if (!touchSleep && !touchQuality && !touchHrv && !touchRhr) return;

  await tx`
    insert into diaries (
      athlete_id, date, sleep_hours, sleep_quality, hrv, resting_hr, device_source, device_synced_at
    ) values (
      ${athleteId},
      ${date}::date,
      ${touchSleep ? (patch.sleepHours ?? null) : null},
      ${touchQuality ? (patch.sleepQuality ?? null) : null},
      ${touchHrv ? (patch.hrv ?? null) : null},
      ${touchRhr ? (patch.restingHr ?? null) : null},
      ${provider},
      now()
    )
    on conflict (athlete_id, date) do update set
      sleep_hours = case when ${touchSleep} then excluded.sleep_hours else diaries.sleep_hours end,
      sleep_quality = case when ${touchQuality} then excluded.sleep_quality else diaries.sleep_quality end,
      hrv = case when ${touchHrv} then excluded.hrv else diaries.hrv end,
      resting_hr = case when ${touchRhr} then excluded.resting_hr else diaries.resting_hr end,
      device_source = ${provider},
      device_synced_at = now()
  `;
}

export async function upsertDeviceWorkouts(
  tx: Tx,
  athleteId: string,
  date: string,
  provider: IntegrationProvider,
  rows: {
    externalId: string;
    sport: string | null;
    durationSeconds: number | null;
    calories: number | null;
    avgHr: number | null;
    payload: Record<string, unknown>;
  }[]
) {
  for (const row of rows) {
    await tx`
      insert into device_workouts (
        athlete_id, date, provider, external_id, sport, duration_seconds, calories, avg_hr, payload, synced_at
      ) values (
        ${athleteId},
        ${date}::date,
        ${provider},
        ${row.externalId},
        ${row.sport},
        ${row.durationSeconds},
        ${row.calories},
        ${row.avgHr},
        ${tx.json(JSON.parse(JSON.stringify(row.payload)))},
        now()
      )
      on conflict (athlete_id, provider, external_id) do update set
        sport = excluded.sport,
        duration_seconds = excluded.duration_seconds,
        calories = excluded.calories,
        avg_hr = excluded.avg_hr,
        payload = excluded.payload,
        synced_at = now()
    `;
  }
}
