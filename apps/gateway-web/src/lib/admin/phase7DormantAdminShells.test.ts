/**
 * Phase 7 prep — K/G/P admin shells respect dormancy (not G7).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  __resetDomainModulesForTests,
  getDomainModule,
  listDomainModules,
} from "@dial/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const SHELLS = [
  {
    moduleId: "hr_payroll",
    page: "app/admin/hr/page.tsx",
    testId: "admin-hr-payroll",
  },
  {
    moduleId: "pricing",
    page: "app/admin/pricing/page.tsx",
    testId: "admin-pricing",
  },
  {
    moduleId: "analytics",
    page: "app/admin/analytics/page.tsx",
    testId: "admin-analytics",
  },
] as const;

test("Phase7-prep: K/G/P admin shells exist and bind dormant modules", () => {
  __resetDomainModulesForTests();
  const shellSrc = readFileSync(
    join(root, "lib/admin/DormantDomainModuleShell.tsx"),
    "utf8",
  );
  assert.match(shellSrc, /data-dormant/);
  assert.match(shellSrc, /DORMANT/);
  assert.doesNotMatch(shellSrc, /how to|click here|enable this module/i);

  for (const s of SHELLS) {
    const page = readFileSync(join(root, s.page), "utf8");
    assert.match(page, new RegExp(s.testId));
    assert.match(page, new RegExp(`moduleId="${s.moduleId}"`));
    assert.doesNotMatch(page, /fake live|TODO ops|helper text/i);

    const row = getDomainModule(s.moduleId);
    assert.ok(row, s.moduleId);
    assert.equal(row.certification, "dormant");
    assert.equal(row.publicMvpLadder, false);
    assert.equal(row.payableFromAi, false);
  }

  assert.ok(listDomainModules().some((m) => m.moduleId === "hr_payroll"));
});
