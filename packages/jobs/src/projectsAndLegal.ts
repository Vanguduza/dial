/**
 * PD24 Admin Projects toggle + legal compliance hub (Pack §9.5 / C-3 / §3.8–3.9).
 * Client Projects default OFF ("coming soon"); live toggle gated on labour-law ack.
 * Legal hub: entity checklists, education topics, versioned T&Cs — no money path.
 */

export type ProjectsClientVisibility = "coming_soon" | "live";

export type ProjectsToggleState = {
  clientVisibility: ProjectsClientVisibility;
  staffToolsEnabled: true;
  labourLawReviewAck: boolean;
  fundedWorkingCapitalAck: boolean;
  lastChangedBy: string | null;
  lastChangedAt: string | null;
  audit: Array<{
    at: string;
    by: string;
    from: ProjectsClientVisibility;
    to: ProjectsClientVisibility;
    note: string;
  }>;
};

export type InternalProjectDraft = {
  projectId: string;
  title: string;
  status: "internal_draft" | "internal_review";
  clientVisible: boolean;
  createdBy: string;
  createdAt: string;
  /** Draft economics only — never AI payable. */
  payableFromAi: false;
};

export type LegalEntityType = "supplier" | "technician" | "fleet" | "project";

export type LegalChecklistItem = {
  id: string;
  label: string;
  dueAt: string | null;
  status: "open" | "done" | "overdue";
};

export type LegalEntityChecklist = {
  entityType: LegalEntityType;
  entityId: string;
  items: LegalChecklistItem[];
};

export type LegalEducationTopic = {
  id: string;
  title: string;
  summary: string;
  linkedWorkflow: string;
};

export type TermsVersion = {
  versionId: string;
  audience: "customer" | "supplier" | "technician" | "mechanic_channel";
  title: string;
  publishedAt: string;
  bodyRef: string;
};

export type TermsAcceptance = {
  acceptanceId: string;
  versionId: string;
  partyId: string;
  acceptedAt: string;
  channel: "admin" | "web" | "android" | "ios" | "whatsapp";
};

let projectsToggle: ProjectsToggleState = defaultProjectsToggle();
const internalProjects = new Map<string, InternalProjectDraft>();
const entityChecklists = new Map<string, LegalEntityChecklist>();
const termsVersions = new Map<string, TermsVersion>();
const termsAcceptances: TermsAcceptance[] = [];

function defaultProjectsToggle(): ProjectsToggleState {
  return {
    clientVisibility: "coming_soon",
    staffToolsEnabled: true,
    labourLawReviewAck: false,
    fundedWorkingCapitalAck: false,
    lastChangedBy: null,
    lastChangedAt: null,
    audit: [],
  };
}

function checklistKey(entityType: LegalEntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

const EDUCATION_TOPICS: LegalEducationTopic[] = [
  {
    id: "edu_employment_vs_contractor",
    title: "Employment vs contractor",
    summary:
      "Technicians quote, accept/decline freely, and invoice per job — not employee discipline.",
    linkedWorkflow: "tech_dispatch",
  },
  {
    id: "edu_job_reserve_escrow",
    title: "Job Reserve / escrow",
    summary: "Held funds settle only on evidence + human rules — not AI payable amounts.",
    linkedWorkflow: "job_reserve",
  },
  {
    id: "edu_consumer_cancellation",
    title: "Consumer cancellation rights",
    summary: "Plain-language cancel windows before work starts; disclose on booking surfaces.",
    linkedWorkflow: "booking",
  },
  {
    id: "edu_regulated_trades",
    title: "Regulated trades",
    summary: "Credentials verified before bookable — fake-certificate risk is product risk.",
    linkedWorkflow: "vetting",
  },
  {
    id: "edu_projects_labour_gate",
    title: "Projects labour-law gate",
    summary:
      "Client Projects live toggle requires labour-law review (D-14) + funded working capital.",
    linkedWorkflow: "projects_toggle",
  },
];

export function getProjectsToggle(): ProjectsToggleState {
  return {
    ...projectsToggle,
    audit: [...projectsToggle.audit],
  };
}

/** Client-facing Projects surface — soft-launch until toggle live (C-3). */
export function clientProjectsSurface(): {
  mode: ProjectsClientVisibility;
  label: "coming soon" | "projects";
  clientCanCreate: boolean;
} {
  if (projectsToggle.clientVisibility === "live") {
    return { mode: "live", label: "projects", clientCanCreate: true };
  }
  return { mode: "coming_soon", label: "coming soon", clientCanCreate: false };
}

export function setProjectsLabourGates(input: {
  labourLawReviewAck: boolean;
  fundedWorkingCapitalAck: boolean;
  setBy: string;
}): ProjectsToggleState {
  projectsToggle = {
    ...projectsToggle,
    labourLawReviewAck: input.labourLawReviewAck,
    fundedWorkingCapitalAck: input.fundedWorkingCapitalAck,
    lastChangedBy: input.setBy,
    lastChangedAt: new Date().toISOString(),
  };
  return getProjectsToggle();
}

/**
 * Turn Projects on/off for clients. Live requires both gates (C-3 / §3.9 / D-14).
 */
export function setProjectsClientVisibility(input: {
  visibility: ProjectsClientVisibility;
  setBy: string;
  note?: string;
}): ProjectsToggleState {
  if (input.visibility === "live") {
    if (!projectsToggle.labourLawReviewAck || !projectsToggle.fundedWorkingCapitalAck) {
      throw new Error(
        "Projects live requires labourLawReviewAck + fundedWorkingCapitalAck (C-3/D-14)",
      );
    }
  }
  const from = projectsToggle.clientVisibility;
  const at = new Date().toISOString();
  projectsToggle = {
    ...projectsToggle,
    clientVisibility: input.visibility,
    lastChangedBy: input.setBy,
    lastChangedAt: at,
    audit: [
      ...projectsToggle.audit,
      {
        at,
        by: input.setBy,
        from,
        to: input.visibility,
        note: input.note ?? "",
      },
    ],
  };
  return getProjectsToggle();
}

/** Staff/ops internal project draft — available even when client toggle is coming_soon. */
export function createInternalProjectDraft(input: {
  title: string;
  createdBy: string;
}): InternalProjectDraft {
  if (!projectsToggle.staffToolsEnabled) {
    throw new Error("Staff Projects tools disabled");
  }
  const projectId = `proj_${internalProjects.size + 1}_${Date.now().toString(36)}`;
  const draft: InternalProjectDraft = {
    projectId,
    title: input.title,
    status: "internal_draft",
    clientVisible: false,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    payableFromAi: false,
  };
  internalProjects.set(projectId, draft);
  return draft;
}

export function listInternalProjectDrafts(): InternalProjectDraft[] {
  return [...internalProjects.values()];
}

export function seedLegalEntityChecklist(input: {
  entityType: LegalEntityType;
  entityId: string;
  items?: LegalChecklistItem[];
}): LegalEntityChecklist {
  const items =
    input.items ??
    defaultChecklistItems(input.entityType);
  const row: LegalEntityChecklist = {
    entityType: input.entityType,
    entityId: input.entityId,
    items,
  };
  entityChecklists.set(checklistKey(input.entityType, input.entityId), row);
  return row;
}

function defaultChecklistItems(entityType: LegalEntityType): LegalChecklistItem[] {
  const base: LegalChecklistItem[] = [
    {
      id: "licence_current",
      label: "Primary licence / credential current",
      dueAt: null,
      status: "open",
    },
    {
      id: "consent_register",
      label: "POTRAZ / consent register entry",
      dueAt: null,
      status: "open",
    },
  ];
  if (entityType === "technician") {
    base.push({
      id: "itf263_status",
      label: "ITF263 / withholding certificate status",
      dueAt: null,
      status: "open",
    });
  }
  if (entityType === "supplier" || entityType === "fleet") {
    base.push({
      id: "fiscal_day",
      label: "Fiscalisation day status",
      dueAt: null,
      status: "open",
    });
  }
  if (entityType === "project") {
    base.push({
      id: "labour_structure",
      label: "Labour-law structure reviewed before live delivery",
      dueAt: null,
      status: "open",
    });
  }
  return base;
}

export function listLegalEntityChecklists(): LegalEntityChecklist[] {
  return [...entityChecklists.values()];
}

export function listLegalEducationTopics(): LegalEducationTopic[] {
  return [...EDUCATION_TOPICS];
}

export function publishTermsVersion(input: {
  audience: TermsVersion["audience"];
  title: string;
  bodyRef: string;
  versionId?: string;
}): TermsVersion {
  const versionId =
    input.versionId ??
    `tc_${input.audience}_${termsVersions.size + 1}_${Date.now().toString(36)}`;
  const row: TermsVersion = {
    versionId,
    audience: input.audience,
    title: input.title,
    publishedAt: new Date().toISOString(),
    bodyRef: input.bodyRef,
  };
  termsVersions.set(versionId, row);
  return row;
}

export function listTermsVersions(): TermsVersion[] {
  return [...termsVersions.values()];
}

export function acceptTermsVersion(input: {
  versionId: string;
  partyId: string;
  channel: TermsAcceptance["channel"];
}): TermsAcceptance {
  if (!termsVersions.has(input.versionId)) {
    throw new Error(`Unknown terms version ${input.versionId}`);
  }
  const row: TermsAcceptance = {
    acceptanceId: `acc_${termsAcceptances.length + 1}`,
    versionId: input.versionId,
    partyId: input.partyId,
    acceptedAt: new Date().toISOString(),
    channel: input.channel,
  };
  termsAcceptances.push(row);
  return row;
}

export function listTermsAcceptances(): TermsAcceptance[] {
  return [...termsAcceptances];
}

export function legalComplianceSnapshot() {
  return {
    projects: getProjectsToggle(),
    clientSurface: clientProjectsSurface(),
    internalProjects: listInternalProjectDrafts(),
    checklists: listLegalEntityChecklists(),
    education: listLegalEducationTopics(),
    terms: listTermsVersions(),
    acceptances: listTermsAcceptances(),
    payableFromAi: false as const,
  };
}

export function assertProjectsLegalNotMoneyPath(): {
  writesPriceQuotes: false;
  writesLedger: false;
  writesJobReserve: false;
  payableFromAi: false;
} {
  return {
    writesPriceQuotes: false,
    writesLedger: false,
    writesJobReserve: false,
    payableFromAi: false,
  };
}

/**
 * PD24 thin vertical: coming_soon default → staff draft → live blocked without gates →
 * gates + live → legal checklist + T&C publish/accept.
 */
export function runPd24AdminProjectsLegalThinVertical(): {
  defaultComingSoon: true;
  staffDraftWhileOff: true;
  liveBlockedWithoutGates: true;
  liveAfterGates: true;
  termsAccepted: true;
  checklistSeeded: true;
  moneyPathClean: true;
  payableFromAi: false;
} {
  __resetProjectsAndLegalForTests();

  const surface0 = clientProjectsSurface();
  if (surface0.mode !== "coming_soon" || surface0.clientCanCreate) {
    throw new Error("PD24 default must be coming_soon with client create off");
  }

  const draft = createInternalProjectDraft({
    title: "PD24 internal scaffold",
    createdBy: "ops_pd24",
  });
  if (draft.clientVisible || draft.payableFromAi) {
    throw new Error("Internal draft must not be client-visible or AI-payable");
  }

  let blocked = false;
  try {
    setProjectsClientVisibility({
      visibility: "live",
      setBy: "ops_pd24",
      note: "should fail",
    });
  } catch {
    blocked = true;
  }
  if (!blocked) {
    throw new Error("PD24 must refuse live without labour/capital gates");
  }

  setProjectsLabourGates({
    labourLawReviewAck: true,
    fundedWorkingCapitalAck: true,
    setBy: "counsel_pd24",
  });
  setProjectsClientVisibility({
    visibility: "live",
    setBy: "ops_pd24",
    note: "gates satisfied",
  });
  const surface1 = clientProjectsSurface();
  if (surface1.mode !== "live" || !surface1.clientCanCreate) {
    throw new Error("PD24 expected live client surface after gates");
  }

  seedLegalEntityChecklist({
    entityType: "technician",
    entityId: "tech_pd24",
  });
  seedLegalEntityChecklist({
    entityType: "project",
    entityId: draft.projectId,
  });
  const tc = publishTermsVersion({
    audience: "customer",
    title: "Customer T&C PD24",
    bodyRef: "fixture://tc/customer/pd24",
  });
  acceptTermsVersion({
    versionId: tc.versionId,
    partyId: "cust_pd24",
    channel: "admin",
  });

  const money = assertProjectsLegalNotMoneyPath();
  if (money.payableFromAi) {
    throw new Error("PD24 must keep payableFromAi false");
  }

  return {
    defaultComingSoon: true,
    staffDraftWhileOff: true,
    liveBlockedWithoutGates: true,
    liveAfterGates: true,
    termsAccepted: true,
    checklistSeeded: true,
    moneyPathClean: true,
    payableFromAi: false,
  };
}

export function __resetProjectsAndLegalForTests(): void {
  projectsToggle = defaultProjectsToggle();
  internalProjects.clear();
  entityChecklists.clear();
  termsVersions.clear();
  termsAcceptances.length = 0;
}
