import {
  BriefcaseBusiness,
  Users,
  Star,
  Wrench,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

export interface Statistic {
  id: number;
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
}

export const statistics: Statistic[] = [
  {
    id: 1,
    title: "Completed Jobs",
    value: 15000,
    suffix: "+",
    icon: BriefcaseBusiness,
  },
  {
    id: 2,
    title: "Verified Technicians",
    value: 850,
    suffix: "+",
    icon: Users,
  },
  {
    id: 3,
    title: "Average Rating",
    value: 4.9,
    icon: Star,
  },
  {
    id: 4,
    title: "Service Categories",
    value: 50,
    suffix: "+",
    icon: Wrench,
  },
];