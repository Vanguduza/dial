/**
 * Phase 7 prep — Module K (HR / Payroll-ZW). Registry-seeded dormant (D-53).
 */
"use client";

import { DormantDomainModuleShell } from "../../../lib/admin/DormantDomainModuleShell";

export default function AdminHrPayrollPage() {
  return (
    <DormantDomainModuleShell
      moduleId="hr_payroll"
      title="HR / Payroll-ZW"
      testId="admin-hr-payroll"
    />
  );
}
