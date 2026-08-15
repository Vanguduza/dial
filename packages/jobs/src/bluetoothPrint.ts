/**
 * PD31 — Bluetooth thermal print hooks (Pack §9.7 / D-46 ESC/POS pattern).
 * Tech ops job ticket / receipt stub — NOT ZIMRA fiscal SoR (D-40a virtual FDMS).
 * AI never writes payable amounts; ticket may echo existing draftAmountUsdMinor only.
 */

export type ThermalPrinterBond = {
  printerId: string;
  technicianId: string;
  label: string;
  /** Bluetooth MAC-like fixture id — never a secret. */
  bluetoothAddress: string;
  protocol: "escpos";
  donorPattern: "DantSu_ESCPOS_ThermalPrinter_Android";
  pairedAt: string;
  /** Explicit: not agency FDMS / ZIMRA printer. */
  zimraFiscalSor: false;
  fdmsVirtualOnly: true;
};

export type ThermalPrintJob = {
  printJobId: string;
  technicianId: string;
  printerId: string;
  jobId: string;
  kind: "job_ticket";
  /** ESC/POS-ish text payload for fixture/sandbox. */
  escposText: string;
  status: "queued" | "sent" | "failed";
  /** Draft economics echo only — not a payable write. */
  draftAmountUsdMinor?: string;
  payableFromAi: false;
  zimraFiscalSor: false;
  createdAt: string;
  sentAt?: string;
};

const printers = new Map<string, ThermalPrinterBond>();
const printJobs = new Map<string, ThermalPrintJob>();

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function pairThermalPrinter(input: {
  technicianId: string;
  label?: string;
  bluetoothAddress?: string;
}): ThermalPrinterBond {
  const bond: ThermalPrinterBond = {
    printerId: id("btp"),
    technicianId: input.technicianId,
    label: (input.label ?? "DIAL thermal").slice(0, 80),
    bluetoothAddress: (
      input.bluetoothAddress ?? `AA:BB:CC:${Math.floor(Math.random() * 90 + 10)}:00:01`
    ).slice(0, 32),
    protocol: "escpos",
    donorPattern: "DantSu_ESCPOS_ThermalPrinter_Android",
    pairedAt: new Date().toISOString(),
    zimraFiscalSor: false,
    fdmsVirtualOnly: true,
  };
  printers.set(bond.printerId, bond);
  return { ...bond };
}

export function listThermalPrinters(technicianId: string): ThermalPrinterBond[] {
  return [...printers.values()]
    .filter((p) => p.technicianId === technicianId)
    .map((p) => ({ ...p }));
}

export function getThermalPrinter(printerId: string): ThermalPrinterBond | undefined {
  const p = printers.get(printerId);
  return p ? { ...p } : undefined;
}

/**
 * Build + send (fixture) a job ticket over Bluetooth ESC/POS hook.
 * Does not call FDMS / CloudESD / ZIMRA.
 */
export function printJobTicket(input: {
  technicianId: string;
  printerId: string;
  jobId: string;
  jobClassId?: string;
  draftAmountUsdMinor?: bigint;
}): ThermalPrintJob {
  const printer = printers.get(input.printerId);
  if (!printer) throw new Error("Unknown printer — pair first");
  if (printer.technicianId !== input.technicianId) {
    throw new Error("Printer not paired to this technician");
  }
  if (printer.zimraFiscalSor !== false || !printer.fdmsVirtualOnly) {
    throw new Error("Thermal hook must not be ZIMRA fiscal SoR (D-40a)");
  }

  const draft =
    input.draftAmountUsdMinor !== undefined
      ? input.draftAmountUsdMinor.toString()
      : undefined;
  const lines = [
    "DIAL JOB TICKET",
    `Job: ${input.jobId}`,
    input.jobClassId ? `Class: ${input.jobClassId}` : null,
    draft ? `Draft USD minor: ${draft} (not payable write)` : null,
    "FDMS: virtual API only — this is NOT a fiscal receipt",
    "ESC/POS Bluetooth ops hook (D-46 pattern)",
    "--- cut ---",
  ].filter(Boolean) as string[];

  const row: ThermalPrintJob = {
    printJobId: id("prj"),
    technicianId: input.technicianId,
    printerId: input.printerId,
    jobId: input.jobId,
    kind: "job_ticket",
    escposText: lines.join("\n"),
    status: "sent",
    ...(draft ? { draftAmountUsdMinor: draft } : {}),
    payableFromAi: false,
    zimraFiscalSor: false,
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  };
  printJobs.set(row.printJobId, row);
  return { ...row };
}

export function listThermalPrintJobs(technicianId: string): ThermalPrintJob[] {
  return [...printJobs.values()]
    .filter((j) => j.technicianId === technicianId)
    .map((j) => ({ ...j }));
}

export function __resetBluetoothPrintForTests(): void {
  printers.clear();
  printJobs.clear();
}
