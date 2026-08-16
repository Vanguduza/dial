/**
 * Phase 7 prep — Module G (Pricing / rate cards). Registry-seeded dormant (D-53).
 */
"use client";

import { DormantDomainModuleShell } from "../../../lib/admin/DormantDomainModuleShell";

export default function AdminPricingPage() {
  return (
    <DormantDomainModuleShell
      moduleId="pricing"
      title="Pricing / rate cards"
      testId="admin-pricing"
    />
  );
}
