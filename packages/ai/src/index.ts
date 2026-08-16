/**
 * packages/ai E4a thin — guidedIntake → JobAssessment only (no price).
 * AI never writes payable amounts. D-32: omit identity from model egress.
 */
import { z } from "zod";

/** Routing hint only — never a technician id or payable amount. */
export const SpecialistHintSchema = z.object({
  required: z
    .boolean()
    .describe("True when the symptom needs an OEM-registered specialist"),
  brand: z
    .string()
    .nullable()
    .describe("Canonical OEM brand such as mercedes; never a technician id"),
  system: z
    .string()
    .nullable()
    .describe("Optional vehicle system such as powertrain"),
  reason: z
    .string()
    .min(1)
    .describe("Short routing reason; no money and no identity"),
});

export type SpecialistHint = z.infer<typeof SpecialistHintSchema>;

/** Structured assessment — no price / amount fields (C-1 / D-32). */
export const JobAssessmentSchema = z.object({
  summary: z.string().min(1),
  likelyJobClass: z.string().min(1),
  urgency: z.enum(["normal", "emergency"]),
  needsHumanQuote: z.literal(true),
  specialistHint: SpecialistHintSchema,
});

export type JobAssessment = z.infer<typeof JobAssessmentSchema>;

export type GuidedIntakeInput = {
  /** Customer words — may contain PII; stripped before any model egress. */
  customerText: string;
  /** Never sent to model. */
  customerUserId?: string;
  customerPhone?: string;
};

/** Strip identity before model-shaped processing (D-32). */
export function toModelEgress(input: GuidedIntakeInput): { text: string } {
  return { text: input.customerText.trim() };
}

const SPECIALIST_OEM: Array<{ canonical: string; pattern: RegExp }> = [
  { canonical: "mercedes", pattern: /\bmercedes(?:[\s-]?benz)?\b|\bbenz\b|\bmb\b/i },
  { canonical: "bmw", pattern: /\bbmw\b/i },
  { canonical: "audi", pattern: /\baudi\b/i },
  { canonical: "porsche", pattern: /\bporsche\b/i },
  { canonical: "land_rover", pattern: /\b(?:land|range)[\s-]?rover\b/i },
];

const VEHICLE_SYSTEMS: Array<{ canonical: string; pattern: RegExp }> = [
  {
    canonical: "powertrain",
    pattern: /\b(?:powertrain|transmission|gearbox|drivetrain)\b/i,
  },
  { canonical: "electrical", pattern: /\b(?:electrical|wiring|ecu|canbus)\b/i },
  { canonical: "hvac", pattern: /\b(?:aircon|a\/c|hvac|climate)\b/i },
];

/**
 * Structured specialist routing from symptom text.
 * Emits brand/system only — never technician ids (matching is deterministic).
 */
export function inferSpecialistHint(text: string): SpecialistHint {
  const system =
    VEHICLE_SYSTEMS.find((s) => s.pattern.test(text))?.canonical ?? null;
  const brand =
    SPECIALIST_OEM.find((b) => b.pattern.test(text))?.canonical ?? null;
  if (brand) {
    return SpecialistHintSchema.parse({
      required: true,
      brand,
      system,
      reason: system
        ? `Needs a registered ${brand} specialist for ${system}`
        : `Needs a registered ${brand} specialist`,
    });
  }
  return SpecialistHintSchema.parse({
    required: false,
    brand: null,
    system,
    reason: "General technician is sufficient",
  });
}

/**
 * Stub guidedIntake — deterministic draft assessment (no LLM call in thin path).
 * Always requires human quote; never emits payable amounts or technician ids.
 */
export function guidedIntake(input: GuidedIntakeInput): JobAssessment {
  const { text } = toModelEgress(input);
  if (!text) throw new Error("customerText required");
  const emergency =
    /\b(emergency|tow|stranded|accident)\b/i.test(text) ||
    /\bbattery\b/i.test(text);
  const assessment = JobAssessmentSchema.parse({
    summary: text.slice(0, 280),
    likelyJobClass: emergency ? "jc_roadside" : "jc_diag",
    urgency: emergency ? "emergency" : "normal",
    needsHumanQuote: true,
    specialistHint: inferSpecialistHint(text),
  });
  // Guard: schema must not grow price fields silently.
  assertNoPayableKeys(assessment);
  if ("technicianId" in assessment || "technicianIds" in assessment) {
    throw new Error("guidedIntake must not emit technician ids");
  }
  return assessment;
}

function assertNoPayableKeys(value: unknown): void {
  const banned = /price|amount|minor|payable|fee|cost|usd|zwg|zig/i;
  const walk = (v: unknown, path: string): void => {
    if (v && typeof v === "object") {
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
        if (banned.test(k)) {
          throw new Error(`Forbidden payable key at ${path}.${k}`);
        }
        walk(child, `${path}.${k}`);
      }
    }
  };
  walk(value, "assessment");
}

export type OpsDraftQuote = {
  assessmentSummary: string;
  humanApprovalRequired: true;
  /** Never auto-posted to ledger. */
  ledgerWrite: false;
};

export function opsDraftQuoteFromAssessment(
  assessment: JobAssessment,
): OpsDraftQuote {
  return {
    assessmentSummary: assessment.summary,
    humanApprovalRequired: true,
    ledgerWrite: false,
  };
}

/**
 * Pack §10 `/ai/client-assessment` — same no-money assessment surface as guided intake.
 */
export function clientAssessment(input: GuidedIntakeInput): JobAssessment {
  return guidedIntake(input);
}

/**
 * PD88 thin vertical: guided intake → Zod assessment; no payable keys (Pack §10 AI).
 */
export function runPd88GuidedIntakeThinVertical(): {
  urgency: "emergency" | "normal";
  needsHumanQuote: true;
  identityOmitted: true;
  payableFromAi: false;
} {
  const egress = toModelEgress({
    customerText: "battery dead stranded on highway",
    customerUserId: "usr_secret",
    customerPhone: "+263771111111",
  });
  if (egress.text.includes("usr_secret") || egress.text.includes("+263")) {
    throw new Error("PD88 identity must be omitted from egress");
  }
  const assessment = guidedIntake({
    customerText: "battery dead stranded on highway",
    customerUserId: "usr_secret",
  });
  if (assessment.urgency !== "emergency" || !assessment.needsHumanQuote) {
    throw new Error("PD88 expected emergency + needsHumanQuote");
  }
  assertNoPayableKeys(assessment);
  return {
    urgency: assessment.urgency,
    needsHumanQuote: true,
    identityOmitted: true,
    payableFromAi: false,
  };
}

/**
 * PD89 thin vertical: assessment → ops draft quote (never ledger write).
 */
export function runPd89OpsDraftQuoteThinVertical(): {
  humanApprovalRequired: true;
  ledgerWrite: false;
  payableFromAi: false;
} {
  const assessment = clientAssessment({
    customerText: "engine noise on idle",
  });
  const draft = opsDraftQuoteFromAssessment(assessment);
  if (!draft.humanApprovalRequired || draft.ledgerWrite !== false) {
    throw new Error("PD89 draft must require human and forbid ledger write");
  }
  return {
    humanApprovalRequired: true,
    ledgerWrite: false,
    payableFromAi: false,
  };
}

export {
  registerMetricContract,
  listMetricContracts,
  ensureDefaultMetricContracts,
  setMetricObservedValue,
  listMetricTiles,
  recordOutcomeWeightedDataset,
  evaluateShadowPromote,
  createIntelligenceShadowRun,
  recordShadowPromptfooResult,
  humanApproveShadowRun,
  rejectShadowRun,
  promoteShadowRun,
  attemptAutoPublishShadow,
  listIntelligenceShadowRuns,
  listFactoryDatasets,
  getIntelligenceFactorySnapshot,
  runPd17IntelligenceFactoryThinVertical,
  runPd47CommandCentreActionsThinVertical,
  recommendedActionsForTile,
  commandCentreBanner,
  attemptCommandCentrePayout,
  executeRecommendedAction,
  runG11IntelligenceCommandCentreSandboxEvidence,
  __resetIntelligenceForTests,
  type MetricContract,
  type MetricTile,
  type RecommendedAction,
  type FactoryDatasetVersion,
  type ShadowPromoteGate,
  type CommandCentreMode,
  type FactoryDraftArtifact,
  type IntelligenceShadowRun,
  type IntelligenceFactorySnapshot,
} from "./intelligence.js";

export {
  __resetCommercialSimForTests,
  attemptCommercialSimPayout,
  commercialSimSnapshot,
  completeCommercialSimRun,
  createCommercialSimRun,
  getCommercialSimRun,
  listCommercialSimRuns,
  runPd23CommercialSimThinVertical,
  setCommercialSimMode,
  startCommercialSimRun,
  type CommercialSimMode,
  type CommercialSimRun,
  type CommercialSimRunStatus,
} from "./commercialSim.js";

export { completeViaLiteLlm, pingLiteLlm, type LiteLlmCompletion } from "./litellm.js";
