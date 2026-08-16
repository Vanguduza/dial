
import { IconType } from "react-icons";
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";

export interface FooterLink {
  label: string;
  href: string;
}

export interface SocialLink {
  icon: IconType;
  href: string;
}

export const companyLinks: FooterLink[] = [
  { label: "About Us", href: "/tech/about" },
  { label: "Our Services", href: "/tech/services" },
  { label: "Find Technicians", href: "/tech/find-technicians" },
  { label: "Diagnose", href: "/tech/guide" },
  { label: "Emergency", href: "/tech/emergency" },
  { label: "How It Works", href: "/tech/how-it-works" },
];

export const supportLinks: FooterLink[] = [
  { label: "Help Center", href: "/tech/help" },
  { label: "Contact Us", href: "/tech/contact" },
  { label: "Privacy Policy", href: "/tech/privacy-policy" },
  { label: "Terms & Conditions", href: "/tech/terms" },
];

export const socialLinks: SocialLink[] = [
  {
    icon: FaFacebookF,
    href: "https://facebook.com",
  },
  {
    icon: FaXTwitter,
    href: "https://x.com",
  },
  {
    icon: FaInstagram,
    href: "https://instagram.com",
  },
  {
    icon: FaLinkedinIn,
    href: "https://linkedin.com",
  },
  {
    icon: FaGithub,
    href: "https://github.com",
  },
];