import type { Tx } from "@/lib/db";
import type { PolarConfig } from "@/lib/integrations/config";
import { decryptSecret, encryptSecret } from "@/lib/integrations/crypto";
import type { IntegrationProvider } from "@/lib/integrations/capabilities";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date | null;
  externalUserId: string | null;
};

export async function loadIntegrationTokens(
  tx: Tx,
  athleteId: string,
  provider: IntegrationProvider,
  cfg: PolarConfig
): Promise<StoredTokens | null> {
  const rows = await tx<
    {
      access_token_enc: string;
      refresh_token_enc: string;
      token_expires_at: Date | null;
      external_user_id: string | null;
    }[]
  >`
    select access_token_enc, refresh_token_enc, token_expires_at, external_user_id
    from integration_tokens
    where athlete_id = ${athleteId} and provider = ${provider}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    accessToken: decryptSecret(row.access_token_enc, cfg.encKey),
    refreshToken: row.refresh_token_enc ? decryptSecret(row.refresh_token_enc, cfg.encKey) : "",
    tokenExpiresAt: row.token_expires_at,
    externalUserId: row.external_user_id
  };
}

export async function saveIntegrationTokens(
  tx: Tx,
  athleteId: string,
  provider: IntegrationProvider,
  tokens: StoredTokens,
  cfg: PolarConfig
) {
  const accessEnc = encryptSecret(tokens.accessToken, cfg.encKey);
  const refreshEnc = tokens.refreshToken ? encryptSecret(tokens.refreshToken, cfg.encKey) : "";
  await tx`
    insert into integration_tokens (
      athlete_id, provider, access_token_enc, refresh_token_enc, token_expires_at, external_user_id
    ) values (
      ${athleteId}, ${provider}, ${accessEnc}, ${refreshEnc}, ${tokens.tokenExpiresAt}, ${tokens.externalUserId}
    )
    on conflict (athlete_id, provider) do update set
      access_token_enc = excluded.access_token_enc,
      refresh_token_enc = excluded.refresh_token_enc,
      token_expires_at = excluded.token_expires_at,
      external_user_id = excluded.external_user_id
  `;
}

export async function deleteIntegrationTokens(tx: Tx, athleteId: string, provider: IntegrationProvider) {
  await tx`delete from integration_tokens where athlete_id = ${athleteId} and provider = ${provider}`;
}

export async function otherConnectedProvider(
  tx: Tx,
  athleteId: string,
  except: IntegrationProvider
): Promise<IntegrationProvider | null> {
  const rows = await tx<{ provider: IntegrationProvider }[]>`
    select provider from integrations
    where athlete_id = ${athleteId}
      and status = 'connected'
      and provider <> ${except}
    limit 1
  `;
  return rows[0]?.provider ?? null;
}

export async function upsertIntegrationStatus(
  tx: Tx,
  athleteId: string,
  provider: IntegrationProvider,
  status: "connected" | "disconnected" | "error",
  opts?: { lastError?: string | null; lastSyncAt?: Date | null }
) {
  const touchSync = opts?.lastSyncAt !== undefined;
  await tx`
    insert into integrations (athlete_id, provider, status, last_error, last_sync_at, updated_at)
    values (
      ${athleteId}, ${provider}, ${status},
      ${opts?.lastError ?? null},
      ${touchSync ? opts?.lastSyncAt ?? null : null},
      now()
    )
    on conflict (athlete_id, provider) do update set
      status = excluded.status,
      last_error = excluded.last_error,
      last_sync_at = case when ${touchSync} then excluded.last_sync_at else integrations.last_sync_at end,
      updated_at = now()
  `;
}
