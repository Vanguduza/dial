/**
 * Phase 7 prep — Module P (Analytics / Metabase). Registry-seeded dormant (D-53).
 */
"use client";

import { DormantDomainModuleShell } from "../../../lib/admin/DormantDomainModuleShell";

export default function AdminAnalyticsPage() {
  return (
    <DormantDomainModuleShell
      moduleId="analytics"
      title="Analytics / Metabase"
      testId="admin-analytics"
    />
  );
}
