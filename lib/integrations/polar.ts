import type { PolarConfig } from "@/lib/integrations/config";
import type { ProviderCapabilities } from "@/lib/integrations/capabilities";
import { PROVIDER_CAPABILITIES } from "@/lib/integrations/capabilities";

const AUTHORIZE_URL = "https://flow.polar.com/oauth2/authorization";
const TOKEN_URL = "https://polarremote.com/v2/oauth2/token";
const API_BASE = "https://www.polaraccesslink.com/v3";

export type PolarTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  x_user_id?: number;
};

export type PolarDiaryPatch = {
  sleepHours?: number | null;
  sleepQuality?: number | null;
  hrv?: number | null;
  restingHr?: number | null;
};

export type PolarWorkoutRow = {
  externalId: string;
  sport: string | null;
  durationSeconds: number | null;
  calories: number | null;
  avgHr: number | null;
  payload: Record<string, unknown>;
};

type PolarSleepNight = {
  date?: string;
  light_sleep?: number;
  deep_sleep?: number;
  rem_sleep?: number;
  total_sleep?: number;
};

type PolarNightlyRecharge = {
  date?: string;
  sleep_charge?: number;
  hrv_avg?: number;
  heart_rate_avg?: number;
};

type PolarExercise = {
  id?: string | number;
  sport?: string;
  duration?: string;
  calories?: number;
  heart_rate?: { average?: number };
  start_time?: string;
  detailed_sport_info?: string;
};

function basicAuth(cfg: PolarConfig): string {
  return Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
}

export function polarAuthorizeUrl(cfg: PolarConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: "accesslink.read_all",
    state
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function polarExchangeCode(cfg: PolarConfig, code: string): Promise<PolarTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(cfg)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polar token exchange failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as PolarTokenResponse;
}

export async function polarRegisterUser(accessToken: string, memberId: string): Promise<number | null> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "member-id": memberId })
  });
  if (res.status === 409) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polar register user failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { "polar-user-id"?: number; id?: number };
  return json["polar-user-id"] ?? json.id ?? null;
}

async function polarGet<T>(accessToken: string, path: string, query?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
  });
  if (res.status === 404) return {} as T;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polar API ${path} (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function parseDurationSeconds(isoOrSeconds: string | undefined): number | null {
  if (!isoOrSeconds) return null;
  if (/^\d+$/.test(isoOrSeconds)) return Number(isoOrSeconds);
  const m = isoOrSeconds.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!m) return null;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}

function sleepHoursFromNight(n: PolarSleepNight): number | null {
  if (typeof n.total_sleep === "number" && n.total_sleep > 0) {
    return Math.round((n.total_sleep / 3600) * 10) / 10;
  }
  const parts = [n.light_sleep, n.deep_sleep, n.rem_sleep].filter((v) => typeof v === "number") as number[];
  if (!parts.length) return null;
  const sec = parts.reduce((a, b) => a + b, 0);
  return Math.round((sec / 3600) * 10) / 10;
}

export function mapPolarToDiary(
  date: string,
  sleepPayload: { nights?: PolarSleepNight[] } | null,
  rechargePayload: { recharges?: PolarNightlyRecharge[] } | null,
  caps: ProviderCapabilities = PROVIDER_CAPABILITIES.polar
): PolarDiaryPatch | null {
  const night = sleepPayload?.nights?.find((n) => n.date === date);
  const recharge = rechargePayload?.recharges?.find((r) => r.date === date);
  if (!night && !recharge) return null;

  const patch: PolarDiaryPatch = {};
  if (caps.sleepHours && night) {
    patch.sleepHours = sleepHoursFromNight(night);
  }
  if (caps.sleepQuality && recharge && typeof recharge.sleep_charge === "number") {
    patch.sleepQuality = Math.round(recharge.sleep_charge);
  }
  if (caps.hrv && recharge && typeof recharge.hrv_avg === "number") {
    patch.hrv = Math.round(recharge.hrv_avg * 10) / 10;
  }
  if (caps.restingHr && recharge && typeof recharge.heart_rate_avg === "number") {
    patch.restingHr = Math.round(recharge.heart_rate_avg);
  }

  const hasValue = Object.values(patch).some((v) => v !== null && v !== undefined);
  return hasValue ? patch : null;
}

export function mapPolarExercises(date: string, payload: { exercises?: PolarExercise[] } | null): PolarWorkoutRow[] {
  const list = payload?.exercises ?? [];
  return list
    .filter((ex) => {
      const start = ex.start_time?.slice(0, 10);
      return start === date;
    })
    .map((ex) => {
      const externalId = String(ex.id ?? "");
      if (!externalId) return null;
      return {
        externalId,
        sport: ex.sport ?? ex.detailed_sport_info ?? null,
        durationSeconds: parseDurationSeconds(ex.duration),
        calories: typeof ex.calories === "number" ? ex.calories : null,
        avgHr: ex.heart_rate?.average ?? null,
        payload: ex as Record<string, unknown>
      };
    })
    .filter((r): r is PolarWorkoutRow => r !== null);
}

export async function polarFetchDayData(accessToken: string, date: string) {
  const [sleepPayload, rechargePayload, exercisesPayload] = await Promise.all([
    polarGet<{ nights?: PolarSleepNight[] }>(accessToken, "/users/sleep", { from: date, to: date }),
    polarGet<{ recharges?: PolarNightlyRecharge[] }>(accessToken, "/users/nightly-recharge", {
      from: date,
      to: date
    }),
    polarGet<{ exercises?: PolarExercise[] }>(accessToken, "/exercises", {
      from: `${date}T00:00:00.000Z`,
      to: `${date}T23:59:59.999Z`
    })
  ]);
  const diaryPatch = mapPolarToDiary(date, sleepPayload, rechargePayload);
  const workouts = mapPolarExercises(date, exercisesPayload);
  return { diaryPatch, workouts, hasDiaryData: diaryPatch !== null, workoutsCount: workouts.length };
}

export function tokenExpiresAt(expiresInSec: number): Date {
  return new Date(Date.now() + expiresInSec * 1000);
}
