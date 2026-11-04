export type IntegrationProvider = "polar" | "amazfit" | "whoop";

export type DiaryDeviceField =
  | "sleepHours"
  | "sleepQuality"
  | "recovery"
  | "hrv"
  | "restingHr";

export type ProviderCapabilities = Record<DiaryDeviceField, boolean>;

/** Campos del diario que cada proveedor puede rellenar desde la pulsera (sin inventar). */
export const PROVIDER_CAPABILITIES: Record<IntegrationProvider, ProviderCapabilities> = {
  polar: {
    sleepHours: true,
    /** Nightly Recharge `sleep_charge` (0–100), documentado en AccessLink v3. */
    sleepQuality: true,
    recovery: false,
    /** Nightly Recharge `hrv_avg` (ms). */
    hrv: true,
    /** Nightly Recharge `heart_rate_avg` (bpm durante sueño). */
    restingHr: true
  },
  amazfit: {
    sleepHours: false,
    sleepQuality: false,
    recovery: false,
    hrv: false,
    restingHr: false
  },
  whoop: {
    sleepHours: false,
    sleepQuality: false,
    recovery: false,
    hrv: false,
    restingHr: false
  }
};

export function capabilitiesFor(provider: IntegrationProvider | null | undefined): ProviderCapabilities {
  if (!provider) {
    return {
      sleepHours: false,
      sleepQuality: false,
      recovery: false,
      hrv: false,
      restingHr: false
    };
  }
  return PROVIDER_CAPABILITIES[provider];
}

export function isDeviceField(provider: IntegrationProvider | null, field: DiaryDeviceField): boolean {
  if (!provider) return false;
  return PROVIDER_CAPABILITIES[provider][field];
}
