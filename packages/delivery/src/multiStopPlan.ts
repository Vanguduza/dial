/**
 * PD36 — multi-vendor grocery/spare delivery plan (grill Q15).
 * Same deliveryBandId + slotId → one multi-stop job (pickup per supplier → dropoff).
 * Different band/slot → split jobs. Food/Spare only; no liquor. POD/spoilage unchanged.
 */

export type MultiStopVertical = "grocery" | "spare";

export type MultiStopVendorLeg = {
  supplierId: string;
  supplierDisplayName: string;
  pickupAddress: string;
  deliveryBandId: string;
  slotId: string;
  vertical: MultiStopVertical;
  /** Locked false — liquor counsel gate. */
  ageGateRequired: false;
  hasRestrictedSku: false;
};

export type MultiStopPlanStop = {
  sequence: number;
  kind: "pickup" | "dropoff";
  supplierId: string | null;
  supplierDisplayName: string | null;
  address: string;
  label: string;
};

export type MultiStopJobPlan = {
  orderId: string;
  deliveryBandId: string;
  slotId: string;
  dropoffAddress: string;
  vendors: MultiStopVendorLeg[];
  stopSequence: MultiStopPlanStop[];
  mode: "one_multi_stop" | "single";
  liquorAllowed: false;
  podSpoilageRulesUnchanged: true;
  payableFromAi: false;
};

export type MultiStopDispatchResult<TJob> = {
  plans: MultiStopJobPlan[];
  jobs: TJob[];
  jobCount: number;
  /** True when all vendors collapsed into a single job (same band+slot). */
  consolidated: boolean;
  liquorAllowed: false;
  podSpoilageRulesUnchanged: true;
  payableFromAi: false;
};

function assertFoodOrSpareLeg(leg: MultiStopVendorLeg): void {
  if (leg.ageGateRequired || leg.hasRestrictedSku) {
    throw new Error("PD36 liquor/restricted SKUs not allowed (counsel gate)");
  }
  if (leg.vertical !== "grocery" && leg.vertical !== "spare") {
    throw new Error("PD36 vertical must be grocery|spare");
  }
}

function groupKey(band: string, slot: string): string {
  return `${band}|${slot}`;
}

/**
 * Plan stop sequences without creating jobs — pure grouping rules.
 */
export function planMultiStopDeliveries(input: {
  orderId: string;
  dropoffAddress: string;
  vendors: MultiStopVendorLeg[];
}): MultiStopJobPlan[] {
  if (!input.vendors.length) {
    throw new Error("PD36 requires at least one vendor leg");
  }
  for (const v of input.vendors) assertFoodOrSpareLeg(v);

  const groups = new Map<string, MultiStopVendorLeg[]>();
  for (const v of input.vendors) {
    const k = groupKey(v.deliveryBandId, v.slotId);
    const list = groups.get(k) ?? [];
    list.push(v);
    groups.set(k, list);
  }

  const plans: MultiStopJobPlan[] = [];
  for (const [, legs] of groups) {
    const first = legs[0]!;
    const uniqueSuppliers = new Map<string, MultiStopVendorLeg>();
    for (const leg of legs) {
      if (!uniqueSuppliers.has(leg.supplierId)) {
        uniqueSuppliers.set(leg.supplierId, leg);
      }
    }
    const suppliers = [...uniqueSuppliers.values()];
    const stopSequence: MultiStopPlanStop[] = [];
    let seq = 0;
    for (const s of suppliers) {
      seq += 1;
      stopSequence.push({
        sequence: seq,
        kind: "pickup",
        supplierId: s.supplierId,
        supplierDisplayName: s.supplierDisplayName,
        address: s.pickupAddress,
        label: `Pickup ${s.supplierDisplayName}`,
      });
    }
    seq += 1;
    stopSequence.push({
      sequence: seq,
      kind: "dropoff",
      supplierId: null,
      supplierDisplayName: null,
      address: input.dropoffAddress,
      label: "Customer dropoff",
    });

    plans.push({
      orderId: input.orderId,
      deliveryBandId: first.deliveryBandId,
      slotId: first.slotId,
      dropoffAddress: input.dropoffAddress,
      vendors: suppliers,
      stopSequence,
      mode: suppliers.length > 1 ? "one_multi_stop" : "single",
      liquorAllowed: false,
      podSpoilageRulesUnchanged: true,
      payableFromAi: false,
    });
  }
  return plans;
}

/**
 * Create delivery jobs from multi-vendor cart: consolidate same band+slot.
 */
export function createJobsFromMultiStopPlan<TJob>(input: {
  orderId: string;
  dropoffAddress: string;
  vendors: MultiStopVendorLeg[];
  codUsdMinor?: bigint;
  createJob: (args: {
    orderId: string;
    from: string;
    to: string;
    codUsdMinor?: bigint;
  }) => TJob;
}): MultiStopDispatchResult<TJob> {
  const plans = planMultiStopDeliveries({
    orderId: input.orderId,
    dropoffAddress: input.dropoffAddress,
    vendors: input.vendors,
  });
  const jobs: TJob[] = [];
  for (const plan of plans) {
    const firstPickup = plan.stopSequence.find((s) => s.kind === "pickup");
    if (!firstPickup) throw new Error("PD36 plan missing pickup");
    const job = input.createJob({
      orderId: input.orderId,
      from: firstPickup.address,
      to: plan.dropoffAddress,
      ...(input.codUsdMinor !== undefined
        ? { codUsdMinor: input.codUsdMinor }
        : {}),
    });
    jobs.push(job);
  }
  return {
    plans,
    jobs,
    jobCount: jobs.length,
    consolidated: plans.length === 1,
    liquorAllowed: false,
    podSpoilageRulesUnchanged: true,
    payableFromAi: false,
  };
}
