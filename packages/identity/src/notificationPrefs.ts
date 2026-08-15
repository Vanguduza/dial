/**
 * PD131 — Notification preference centre (Pack Matrix B / stitch N pattern).
 * Channel × topic matrix; utility vs marketing cost class. Complements PD78 marketing grant.
 */

export type NotificationChannel = "whatsapp" | "email" | "push";
export type NotificationTopic =
  | "order_updates"
  | "delivery_eta"
  | "job_status"
  | "marketing_promos"
  | "account_security";

export type NotificationCostClass = "utility" | "marketing";

export type NotificationPrefCell = {
  channel: NotificationChannel;
  topic: NotificationTopic;
  enabled: boolean;
  costClass: NotificationCostClass;
};

export type NotificationPrefMatrix = {
  customerId: string;
  cells: NotificationPrefCell[];
  updatedAt: string;
  payableFromAi: false;
};

const TOPIC_COST: Record<NotificationTopic, NotificationCostClass> = {
  order_updates: "utility",
  delivery_eta: "utility",
  job_status: "utility",
  account_security: "utility",
  marketing_promos: "marketing",
};

const CHANNELS: NotificationChannel[] = ["whatsapp", "email", "push"];
const TOPICS: NotificationTopic[] = [
  "order_updates",
  "delivery_eta",
  "job_status",
  "marketing_promos",
  "account_security",
];

const matrices = new Map<string, NotificationPrefMatrix>();

function defaultCells(): NotificationPrefCell[] {
  const cells: NotificationPrefCell[] = [];
  for (const channel of CHANNELS) {
    for (const topic of TOPICS) {
      const costClass = TOPIC_COST[topic];
      cells.push({
        channel,
        topic,
        // Utility on by default; marketing off (opt-in).
        enabled: costClass === "utility",
        costClass,
      });
    }
  }
  return cells;
}

export function getNotificationPrefMatrix(
  customerId: string,
): NotificationPrefMatrix {
  const existing = matrices.get(customerId);
  if (existing) {
    return {
      ...existing,
      cells: existing.cells.map((c) => ({ ...c })),
    };
  }
  return {
    customerId,
    cells: defaultCells(),
    updatedAt: new Date(0).toISOString(),
    payableFromAi: false,
  };
}

export function setNotificationPref(input: {
  customerId: string;
  channel: NotificationChannel;
  topic: NotificationTopic;
  enabled: boolean;
}): NotificationPrefMatrix {
  if (!input.customerId.trim()) throw new Error("customerId required");
  const current = getNotificationPrefMatrix(input.customerId);
  const cells = current.cells.map((c) => {
    if (c.channel === input.channel && c.topic === input.topic) {
      return { ...c, enabled: input.enabled === true };
    }
    return { ...c };
  });
  const row: NotificationPrefMatrix = {
    customerId: input.customerId,
    cells,
    updatedAt: new Date().toISOString(),
    payableFromAi: false,
  };
  matrices.set(input.customerId, row);
  return {
    ...row,
    cells: row.cells.map((c) => ({ ...c })),
  };
}

/**
 * PD131 thin vertical: matrix defaults → opt-in marketing WA → utility stays on.
 */
export function runPd131NotificationPrefsThinVertical(): {
  cellCount: number;
  marketingWasOff: true;
  marketingOptIn: true;
  utilityRemainsOn: true;
  payableFromAi: false;
} {
  __resetNotificationPrefsForTests();
  const customerId = "cust_pd131";
  const initial = getNotificationPrefMatrix(customerId);
  if (initial.cells.length !== CHANNELS.length * TOPICS.length) {
    throw new Error("PD131 expected full channel×topic matrix");
  }
  const marketingWa = initial.cells.find(
    (c) => c.channel === "whatsapp" && c.topic === "marketing_promos",
  );
  if (!marketingWa || marketingWa.enabled || marketingWa.costClass !== "marketing") {
    throw new Error("PD131 marketing WA must default off");
  }
  const orderWa = initial.cells.find(
    (c) => c.channel === "whatsapp" && c.topic === "order_updates",
  );
  if (!orderWa?.enabled || orderWa.costClass !== "utility") {
    throw new Error("PD131 utility order_updates must default on");
  }
  const after = setNotificationPref({
    customerId,
    channel: "whatsapp",
    topic: "marketing_promos",
    enabled: true,
  });
  const m = after.cells.find(
    (c) => c.channel === "whatsapp" && c.topic === "marketing_promos",
  );
  const u = after.cells.find(
    (c) => c.channel === "whatsapp" && c.topic === "order_updates",
  );
  if (!m?.enabled || !u?.enabled || after.payableFromAi !== false) {
    throw new Error("PD131 opt-in / utility checks failed");
  }
  return {
    cellCount: after.cells.length,
    marketingWasOff: true,
    marketingOptIn: true,
    utilityRemainsOn: true,
    payableFromAi: false,
  };
}

export function __resetNotificationPrefsForTests(): void {
  matrices.clear();
}
