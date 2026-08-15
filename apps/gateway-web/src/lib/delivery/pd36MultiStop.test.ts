/**
 * PD36 — multi-stop grocery/spare delivery dogfood (gateway).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createJobsFromMultiStopPlan,
  createDeliveryJob,
  planMultiStopDeliveries,
  runPd36MultiStopDeliveryThinVertical,
} from "@dial/delivery";

describe("PD36 multi-stop delivery dogfood", () => {
  it("package thin vertical greens", async () => {
    const r = await runPd36MultiStopDeliveryThinVertical();
    assert.equal(r.consolidatedJobCount, 1);
    assert.equal(r.splitJobCount, 2);
    assert.equal(r.podSpoilageRulesUnchanged, true);
    assert.equal(r.liquorAllowed, false);
  });

  it("same band/slot → one job; different band → split", () => {
    const one = createJobsFromMultiStopPlan({
      orderId: "ord_gw_one",
      dropoffAddress: "customer_avondale",
      vendors: [
        {
          supplierId: "s1",
          supplierDisplayName: "S1",
          pickupAddress: "supplier_hub_harare",
          deliveryBandId: "harare_metro",
          slotId: "slot_am",
          vertical: "grocery",
          ageGateRequired: false,
          hasRestrictedSku: false,
        },
        {
          supplierId: "s2",
          supplierDisplayName: "S2",
          pickupAddress: "waypoint_borrowdale",
          deliveryBandId: "harare_metro",
          slotId: "slot_am",
          vertical: "grocery",
          ageGateRequired: false,
          hasRestrictedSku: false,
        },
      ],
      createJob: createDeliveryJob,
    });
    assert.equal(one.jobCount, 1);
    assert.equal(one.consolidated, true);

    const split = createJobsFromMultiStopPlan({
      orderId: "ord_gw_split",
      dropoffAddress: "customer_avondale",
      vendors: [
        {
          supplierId: "s1",
          supplierDisplayName: "S1",
          pickupAddress: "supplier_hub_harare",
          deliveryBandId: "harare_metro",
          slotId: "slot_am",
          vertical: "spare",
          ageGateRequired: false,
          hasRestrictedSku: false,
        },
        {
          supplierId: "s2",
          supplierDisplayName: "S2",
          pickupAddress: "waypoint_borrowdale",
          deliveryBandId: "bulawayo_metro",
          slotId: "slot_am",
          vertical: "spare",
          ageGateRequired: false,
          hasRestrictedSku: false,
        },
      ],
      createJob: createDeliveryJob,
    });
    assert.equal(split.jobCount, 2);
    assert.equal(split.consolidated, false);
  });

  it("rejects restricted SKU legs", () => {
    assert.throws(
      () =>
        planMultiStopDeliveries({
          orderId: "ord_bad",
          dropoffAddress: "customer_avondale",
          vendors: [
            {
              supplierId: "liq",
              supplierDisplayName: "Liquor",
              pickupAddress: "supplier_hub_harare",
              deliveryBandId: "harare_metro",
              slotId: "slot_am",
              vertical: "grocery",
              ageGateRequired: false,
              hasRestrictedSku: true as unknown as false,
            },
          ],
        }),
      /restricted|liquor/i,
    );
  });
});
