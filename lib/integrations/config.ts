export type PolarConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  encKey: Buffer;
};

function readEncKey(): Buffer | null {
  const raw = process.env.INTEGRATIONS_ENC_KEY?.trim();
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, "base64");
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

export function polarConfig(): PolarConfig | null {
  const clientId = process.env.POLAR_CLIENT_ID?.trim();
  const clientSecret = process.env.POLAR_CLIENT_SECRET?.trim();
  const redirectUri = process.env.POLAR_REDIRECT_URI?.trim();
  const encKey = readEncKey();
  if (!clientId || !clientSecret || !redirectUri || !encKey) return null;
  return { clientId, clientSecret, redirectUri, encKey };
}

export function polarConfigured(): boolean {
  return polarConfig() !== null;
}
