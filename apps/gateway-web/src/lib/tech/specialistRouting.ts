/**
 * Diagnose → guidedIntake specialistHint → deterministic OEM match.
 * AI never writes payable amounts or technician ids.
 */
import { guidedIntake, type JobAssessment } from "@dial/ai";
import {
  ensureDialTechProfileFixtures,
  matchTechniciansForSpecialistHint,
  resolveChecklistBySymptom,
  type TechnicianProfileCard,
} from "@dial/jobs";

export type TechDiagnoseResult = {
  assessment: JobAssessment;
  checklist: ReturnType<typeof resolveChecklistBySymptom>;
  recommendedSpecialists: TechnicianProfileCard[];
  fallbackTechnicians: TechnicianProfileCard[];
  matchedOnBrand: string | null;
  payableFromAi: false;
};

export function diagnoseTechSymptom(symptom: string): TechDiagnoseResult {
  const text = symptom.trim();
  if (!text) throw new Error("symptom required");
  const assessment = guidedIntake({ customerText: text });
  const checklist = resolveChecklistBySymptom({ symptom: text });
  ensureDialTechProfileFixtures();
  const match = matchTechniciansForSpecialistHint({
    required: assessment.specialistHint.required,
    brand: assessment.specialistHint.brand,
  });
  return {
    assessment,
    checklist,
    recommendedSpecialists: match.recommended,
    fallbackTechnicians: match.fallback,
    matchedOnBrand: match.matchedOnBrand,
    payableFromAi: false,
  };
}
