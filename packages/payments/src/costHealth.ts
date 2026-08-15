/**
 * PD22 Cost & health ops fixture (Pack §9.5 / D-47 / D-60).
 * Surfaces AI/LiteLLM + cloud + SMS/WhatsApp spend with thresholds + kill-switches.
 * IMTT is opex here — never a customer checkout line.
 */
export type CostChannel = "ai_litellm" | "cloud" | "sms_whatsapp";

export type CostSpendBucket = {
  channel: CostChannel;
  /** Opex spend in USD minor — not customer checkout. */
  spentUsdMinor: bigint;
  thresholdUsdMinor: bigint;
  alert: boolean;
  killSwitchEngaged: boolean;
  rateLimitHref: string;
};

export type CostHealthSnapshot = {
  buckets: CostSpendBucket[];
  /** D-60: IMTT tracked as opex, never checkout line. */
  imttOpexUsdMinor: bigint;
  imttOnCheckoutLines: false;
  anyAlert: boolean;
  anyKillSwitch: boolean;
};

type CostHealthStore = {
  spent: Map<CostChannel, bigint>;
  thresholds: Map<CostChannel, bigint>;
  killSwitches: Map<CostChannel, boolean>;
  imttOpexUsdMinor: bigint;
};

const RATE_LIMIT_HREFS: Record<CostChannel, string> = {
  ai_litellm: "/admin/integrations#litellm-rate-limits",
  cloud: "/admin/integrations#cloud-rate-limits",
  sms_whatsapp: "/admin/wa#meta-rate-limits",
};

const DEFAULT_THRESHOLDS: Record<CostChannel, bigint> = {
  ai_litellm: 50_00n,
  cloud: 100_00n,
  sms_whatsapp: 25_00n,
};

function store(): CostHealthStore {
  const g = globalThis as typeof globalThis & {
    __dialCostHealthStore?: CostHealthStore;
  };
  if (!g.__dialCostHealthStore) {
    g.__dialCostHealthStore = {
      spent: new Map([
        ["ai_litellm", 0n],
        ["cloud", 0n],
        ["sms_whatsapp", 0n],
      ]),
      thresholds: new Map(
        Object.entries(DEFAULT_THRESHOLDS) as [CostChannel, bigint][],
      ),
      killSwitches: new Map([
        ["ai_litellm", false],
        ["cloud", false],
        ["sms_whatsapp", false],
      ]),
      imttOpexUsdMinor: 0n,
    };
  }
  return g.__dialCostHealthStore;
}

export function __resetCostHealthForTests(): void {
  const s = store();
  for (const ch of ["ai_litellm", "cloud", "sms_whatsapp"] as CostChannel[]) {
    s.spent.set(ch, 0n);
    s.thresholds.set(ch, DEFAULT_THRESHOLDS[ch]);
    s.killSwitches.set(ch, false);
  }
  s.imttOpexUsdMinor = 0n;
}

export function recordOpsSpend(input: {
  channel: CostChannel;
  amountUsdMinor: bigint;
}): CostSpendBucket {
  if (input.amountUsdMinor <= 0n) {
    throw new Error("amountUsdMinor must be positive");
  }
  const s = store();
  const prev = s.spent.get(input.channel) ?? 0n;
  s.spent.set(input.channel, prev + input.amountUsdMinor);
  return getCostBucket(input.channel);
}

/** D-60 — record IMTT as platform opex, never attach to checkout lines. */
export function recordImttOpex(amountUsdMinor: bigint): {
  imttOpexUsdMinor: string;
  imttOnCheckoutLines: false;
} {
  if (amountUsdMinor < 0n) throw new Error("IMTT opex cannot be negative");
  store().imttOpexUsdMinor += amountUsdMinor;
  return {
    imttOpexUsdMinor: store().imttOpexUsdMinor.toString(),
    imttOnCheckoutLines: false,
  };
}

export function setCostThreshold(input: {
  channel: CostChannel;
  thresholdUsdMinor: bigint;
}): CostSpendBucket {
  if (input.thresholdUsdMinor <= 0n) {
    throw new Error("thresholdUsdMinor must be positive");
  }
  store().thresholds.set(input.channel, input.thresholdUsdMinor);
  return getCostBucket(input.channel);
}

export function engageKillSwitch(channel: CostChannel): CostSpendBucket {
  store().killSwitches.set(channel, true);
  return getCostBucket(channel);
}

export function releaseKillSwitch(channel: CostChannel): CostSpendBucket {
  store().killSwitches.set(channel, false);
  return getCostBucket(channel);
}

export function getCostBucket(channel: CostChannel): CostSpendBucket {
  const s = store();
  const spent = s.spent.get(channel) ?? 0n;
  const threshold = s.thresholds.get(channel) ?? DEFAULT_THRESHOLDS[channel];
  const killSwitchEngaged = s.killSwitches.get(channel) === true;
  return {
    channel,
    spentUsdMinor: spent,
    thresholdUsdMinor: threshold,
    alert: spent >= threshold,
    killSwitchEngaged,
    rateLimitHref: RATE_LIMIT_HREFS[channel],
  };
}

export function getCostHealthSnapshot(): CostHealthSnapshot {
  const channels: CostChannel[] = ["ai_litellm", "cloud", "sms_whatsapp"];
  const buckets = channels.map(getCostBucket);
  return {
    buckets,
    imttOpexUsdMinor: store().imttOpexUsdMinor,
    imttOnCheckoutLines: false,
    anyAlert: buckets.some((b) => b.alert),
    anyKillSwitch: buckets.some((b) => b.killSwitchEngaged),
  };
}

function serializeBucket(b: CostSpendBucket) {
  return {
    ...b,
    spentUsdMinor: b.spentUsdMinor.toString(),
    thresholdUsdMinor: b.thresholdUsdMinor.toString(),
  };
}

export function serializeCostHealthSnapshot() {
  const snap = getCostHealthSnapshot();
  return {
    buckets: snap.buckets.map(serializeBucket),
    imttOpexUsdMinor: snap.imttOpexUsdMinor.toString(),
    imttOnCheckoutLines: false as const,
    anyAlert: snap.anyAlert,
    anyKillSwitch: snap.anyKillSwitch,
    note: "IMTT is DIAL opex (D-60) — never a customer checkout line",
  };
}
