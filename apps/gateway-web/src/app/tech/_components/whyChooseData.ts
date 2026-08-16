import {
  BadgeCheck,
  Clock3,
  Wallet,
  Headphones,
  ShieldCheck,
  Star,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

export interface WhyChooseItem {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const whyChooseItems: WhyChooseItem[] = [
  {
    id: 1,
    title: "Verified Professionals",
    description:
      "Every technician is carefully verified to ensure quality and trust.",
    icon: BadgeCheck,
  },
  {
    id: 2,
    title: "Fast Booking",
    description:
      "Book trusted home service professionals within minutes.",
    icon: Clock3,
  },
  {
    id: 3,
    title: "EcoCash + COD",
    description:
      "Hold Job Reserve with EcoCash or cash on delivery — never a card checkout.",
    icon: Wallet,
  },
  {
    id: 4,
    title: "Customer Support",
    description:
      "Our support team is available whenever you need assistance.",
    icon: Headphones,
  },
  {
    id: 5,
    title: "Trusted Reviews",
    description:
      "Read genuine reviews from customers before booking.",
    icon: Star,
  },
  {
    id: 6,
    title: "Quality Guarantee",
    description:
      "We connect you with professionals committed to excellent service.",
    icon: ShieldCheck,
  },
];