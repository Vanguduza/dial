import {
  Search,
  Stethoscope,
  CalendarClock,
  Wallet,
  BadgeCheck,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

export interface BookingStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Dial a Tech funnel on FixItNow five-slot chrome — no card-pay copy. */
export const bookingSteps: BookingStep[] = [
  {
    id: 1,
    title: "Diagnose",
    description:
      "Describe the symptom or skip to a known service. Specialists are ranked — AI never prices the job.",
    icon: Stethoscope,
  },
  {
    id: 2,
    title: "Choose technician",
    description:
      "Pick a verified professional. OEM specialists (e.g. Mercedes) rank when the note needs them.",
    icon: Search,
  },
  {
    id: 3,
    title: "Pick time slot",
    description: "Select your preferred date and available time.",
    icon: CalendarClock,
  },
  {
    id: 4,
    title: "Draft + Job Reserve",
    description:
      "Confirm a rate-card USD draft, then hold Job Reserve with EcoCash or COD. No card checkout.",
    icon: Wallet,
  },
  {
    id: 5,
    title: "Job completed",
    description:
      "Track status, open the checklist, and review after evidence is sealed.",
    icon: BadgeCheck,
  },
];
