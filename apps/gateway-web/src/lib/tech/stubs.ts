/**
 * Tech booking / checklist stubs (Pack §15 T4).
 * Quotes are human/pricing-engine drafts — AI never writes payable amounts.
 */
export type TechQuoteDraft = {
  quoteId: string;
  jobClass: string;
  /** Draft only — not a payable amount until pricing engine + human confirm. */
  draftAmountUsdMinor: bigint;
  currency: "USD";
  source: "rate_card_stub";
  emergency: boolean;
};

export type ChecklistId = "automotive_basic" | "emergency_roadside";

export type Checklist = {
  id: ChecklistId;
  title: string;
  steps: string[];
};

const CHECKLISTS: Checklist[] = [
  {
    id: "automotive_basic",
    title: "Automotive basic intake",
    steps: [
      "Confirm vehicle make/model/year",
      "Capture symptom in customer words",
      "Photo of fault area (optional)",
      "Confirm location pin",
    ],
  },
  {
    id: "emergency_roadside",
    title: "Emergency roadside",
    steps: [
      "Confirm safety / hazards",
      "Exact landmark / highway km",
      "Vehicle can move? yes/no",
      "Dispatch without AI price suggestion",
    ],
  },
];

export function listChecklists(): Checklist[] {
  return CHECKLISTS.map((c) => ({ ...c, steps: [...c.steps] }));
}

export function getChecklist(id: ChecklistId): Checklist | undefined {
  const c = CHECKLISTS.find((x) => x.id === id);
  return c ? { ...c, steps: [...c.steps] } : undefined;
}

/** Rate-card stub quote — never treat as final payable (AI must not author). */
export function draftTechQuote(input: {
  jobClass: string;
  emergency?: boolean;
}): TechQuoteDraft {
  const emergency = Boolean(input.emergency);
  return {
    quoteId: `tq_${Date.now().toString(36)}`,
    jobClass: input.jobClass.trim() || "general",
    draftAmountUsdMinor: emergency ? 80_00n : 45_00n,
    currency: "USD",
    source: "rate_card_stub",
    emergency,
  };
}
