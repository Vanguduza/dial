/**
 * Tech booking / checklist — Pack §15 T4 / PD9.
 * Quotes from @dial/jobs rate_card — AI never writes payable amounts.
 * Re-exports jobs SoR; rate_card_stub path removed.
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
