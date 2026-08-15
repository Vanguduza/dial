/**
 * PD60 — Domain module registry (D-53). Certification SoR = in-repo registry,
 * not Unleash. payableFromAi always false.
 */

export type DomainModuleCert =
  | "draft"
  | "certified"
  | "dormant"
  | "retired";

export type DomainModule = {
  moduleId: string;
  label: string;
  certification: DomainModuleCert;
  /** Public multi-phase MVP ladder is NOT this field (D-53). */
  publicMvpLadder: false;
  updatedAt: string;
  updatedBy: string;
  payableFromAi: false;
};

const DEFAULT_MODULES: Array<{ moduleId: string; label: string }> = [
  { moduleId: "spare", label: "Dial a Spare" },
  { moduleId: "grocery", label: "Dial Groceries" },
  { moduleId: "tech", label: "Dial a Tech" },
  { moduleId: "delivery", label: "Delivery dispatch" },
  { moduleId: "promotions", label: "Promotions & referrals" },
  { moduleId: "intelligence", label: "Intelligence Factory" },
];

function store(): Map<string, DomainModule> {
  const g = globalThis as { __dialDomainModules?: Map<string, DomainModule> };
  if (!g.__dialDomainModules) {
    g.__dialDomainModules = new Map();
    const now = new Date().toISOString();
    for (const m of DEFAULT_MODULES) {
      g.__dialDomainModules.set(m.moduleId, {
        moduleId: m.moduleId,
        label: m.label,
        certification: "draft",
        publicMvpLadder: false,
        updatedAt: now,
        updatedBy: "system",
        payableFromAi: false,
      });
    }
  }
  return g.__dialDomainModules;
}

export function listDomainModules(): DomainModule[] {
  return [...store().values()].map((m) => ({ ...m }));
}

export function getDomainModule(moduleId: string): DomainModule | undefined {
  const m = store().get(moduleId);
  return m ? { ...m } : undefined;
}

export function setDomainModuleCertification(input: {
  moduleId: string;
  certification: DomainModuleCert;
  updatedBy: string;
}): DomainModule {
  if (!input.updatedBy.trim()) throw new Error("updatedBy required");
  const existing = store().get(input.moduleId);
  if (!existing) throw new Error(`Unknown domain module ${input.moduleId}`);
  // CERTIFIED–DORMANT ≠ public multi-phase MVP ladder (D-53)
  existing.certification = input.certification;
  existing.updatedBy = input.updatedBy.trim();
  existing.updatedAt = new Date().toISOString();
  existing.publicMvpLadder = false;
  existing.payableFromAi = false;
  return { ...existing };
}

/**
 * PD60 thin vertical: list registry → certify spare → dormancy ≠ public MVP ladder.
 */
export function runPd60DomainModuleRegistryThinVertical(): {
  moduleCount: number;
  spareCertified: true;
  publicMvpLadder: false;
  unleashIsSor: false;
  payableFromAi: false;
} {
  __resetDomainModulesForTests();
  const listed = listDomainModules();
  if (listed.length < 4) throw new Error("PD60 expected seeded domain modules");
  const spare = setDomainModuleCertification({
    moduleId: "spare",
    certification: "certified",
    updatedBy: "ops_pd60",
  });
  if (spare.certification !== "certified" || spare.publicMvpLadder !== false) {
    throw new Error("PD60 certify must keep publicMvpLadder=false");
  }
  const dormant = setDomainModuleCertification({
    moduleId: "intelligence",
    certification: "dormant",
    updatedBy: "ops_pd60",
  });
  if (dormant.publicMvpLadder !== false) {
    throw new Error("PD60 dormant ≠ public MVP ladder");
  }
  return {
    moduleCount: listed.length,
    spareCertified: true,
    publicMvpLadder: false,
    unleashIsSor: false,
    payableFromAi: false,
  };
}

export function __resetDomainModulesForTests(): void {
  const g = globalThis as { __dialDomainModules?: Map<string, DomainModule> };
  delete g.__dialDomainModules;
  store(); // re-seed
}
