/**
 * Tech booking / checklist — Pack §15 T4 / PD9 / PD13.
 * Re-exports @dial/jobs SoR; rate_card only — AI never writes payable amounts.
 */
export {
  advanceChecklistStep,
  bookTechJob,
  draftTechQuote,
  getChecklist,
  getChecklistRun,
  getTechJob,
  listBookingSlots,
  listChecklists,
  listEvidenceForJob,
  listJobsForCustomer,
  listJobsForTechnician,
  startChecklistRun,
  uploadJobEvidence,
  type BookingSlot,
  type Checklist,
  type ChecklistId,
  type ChecklistRun,
  type JobEvidence,
  type JobQuoteDraft as TechQuoteDraft,
  type TechJob,
} from "@dial/jobs";
