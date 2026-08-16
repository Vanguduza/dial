import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetDomainModulesForTests,
  listDomainModules,
  runPd60DomainModuleRegistryThinVertical,
  setDomainModuleCertification,
} from "./domainRegistry.js";

test("PD60 domain module registry thin vertical", () => {
  const out = runPd60DomainModuleRegistryThinVertical();
  assert.equal(out.spareCertified, true);
  assert.equal(out.unleashIsSor, false);
  assert.equal(out.publicMvpLadder, false);
  assert.equal(out.payableFromAi, false);
});

test("PD60 CERTIFIED–DORMANT keeps publicMvpLadder false", () => {
  __resetDomainModulesForTests();
  const certified = setDomainModuleCertification({
    moduleId: "spare",
    certification: "certified",
    updatedBy: "ops",
  });
  assert.equal(certified.publicMvpLadder, false);
  const dormant = setDomainModuleCertification({
    moduleId: "spare",
    certification: "dormant",
    updatedBy: "ops",
  });
  assert.equal(dormant.publicMvpLadder, false);
  assert.ok(listDomainModules().length >= 4);
});

test("Phase7-prep: modules K/G/P seed dormant ≠ public MVP ladder", () => {
  __resetDomainModulesForTests();
  const mods = listDomainModules();
  for (const id of ["hr_payroll", "pricing", "analytics"] as const) {
    const row = mods.find((m) => m.moduleId === id);
    assert.ok(row, `expected ${id}`);
    assert.equal(row.certification, "dormant");
    assert.equal(row.publicMvpLadder, false);
    assert.equal(row.payableFromAi, false);
  }
});
