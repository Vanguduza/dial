/**
 * PD25 ITF263 records (Pack §9.7 / D-50 / D-53).
 * Upload → pending → verified clearance. Certificate PDF stub refs only.
 * Take-Home breakdown lives in index.ts (uses withholding_balances).
 */

export type Itf263Status =
  | "none"
  | "uploaded_pending"
  | "verified"
  | "rejected"
  | "expired";

export type Itf263Record = {
  recordId: string;
  technicianId: string;
  yearOfAssessment: number;
  status: Itf263Status;
  documentRef: string | null;
  /** Stub PDF ref for withholding certificate — not a fiscal SoR. */
  certificatePdfRef: string | null;
  uploadedAt: string | null;
  verifiedAt: string | null;
  payableFromAi: false;
};

const records = new Map<string, Itf263Record>();

function key(technicianId: string, year: number): string {
  return `${technicianId}:${year}`;
}

export function getItf263Record(
  technicianId: string,
  yearOfAssessment: number,
): Itf263Record | undefined {
  const row = records.get(key(technicianId, yearOfAssessment));
  return row ? { ...row } : undefined;
}

export function listItf263Records(): Itf263Record[] {
  return [...records.values()].map((r) => ({ ...r }));
}

/** Technician uploads ITF263 scan/PDF — pending until verified (ops). */
export function uploadItf263Document(input: {
  technicianId: string;
  yearOfAssessment: number;
  documentRef: string;
}): Itf263Record {
  if (!input.documentRef.trim()) {
    throw new Error("documentRef required");
  }
  const k = key(input.technicianId, input.yearOfAssessment);
  const existing = records.get(k);
  const row: Itf263Record = {
    recordId: existing?.recordId ?? `itf_${records.size + 1}`,
    technicianId: input.technicianId,
    yearOfAssessment: input.yearOfAssessment,
    status: "uploaded_pending",
    documentRef: input.documentRef.trim(),
    certificatePdfRef: existing?.certificatePdfRef ?? null,
    uploadedAt: new Date().toISOString(),
    verifiedAt: null,
    payableFromAi: false,
  };
  records.set(k, row);
  return { ...row };
}

/**
 * Ops/fixture sets status. Verified requires prior upload.
 * Verified → Take-Home uses hasItf263=true (0% withhold).
 */
export function setItf263Status(input: {
  technicianId: string;
  yearOfAssessment: number;
  status: Exclude<Itf263Status, "none">;
  setBy: string;
}): Itf263Record {
  const k = key(input.technicianId, input.yearOfAssessment);
  let row = records.get(k);
  if (!row) {
    row = {
      recordId: `itf_${records.size + 1}`,
      technicianId: input.technicianId,
      yearOfAssessment: input.yearOfAssessment,
      status: "none",
      documentRef: null,
      certificatePdfRef: null,
      uploadedAt: null,
      verifiedAt: null,
      payableFromAi: false,
    };
  }
  if (input.status === "verified" && !row.documentRef) {
    throw new Error("Cannot verify ITF263 without uploaded document");
  }
  row = {
    ...row,
    status: input.status,
    verifiedAt:
      input.status === "verified" ? new Date().toISOString() : row.verifiedAt,
    payableFromAi: false,
  };
  void input.setBy;
  records.set(k, row);
  return { ...row };
}

export function technicianHasVerifiedItf263(
  technicianId: string,
  yearOfAssessment: number,
): boolean {
  return getItf263Record(technicianId, yearOfAssessment)?.status === "verified";
}

/** Attach / refresh withholding certificate PDF stub on the ITF263 row. */
export function attachWithholdingCertificatePdf(input: {
  technicianId: string;
  yearOfAssessment: number;
  certificatePdfRef: string;
}): Itf263Record {
  const k = key(input.technicianId, input.yearOfAssessment);
  let row = records.get(k);
  if (!row) {
    row = {
      recordId: `itf_${records.size + 1}`,
      technicianId: input.technicianId,
      yearOfAssessment: input.yearOfAssessment,
      status: "none",
      documentRef: null,
      certificatePdfRef: null,
      uploadedAt: null,
      verifiedAt: null,
      payableFromAi: false,
    };
  }
  row = {
    ...row,
    certificatePdfRef: input.certificatePdfRef,
    payableFromAi: false,
  };
  records.set(k, row);
  return { ...row };
}

export function __resetItf263ForTests(): void {
  records.clear();
}
