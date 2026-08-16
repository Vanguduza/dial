import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./tech.css";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Toaster } from "../../components/ui/sonner";
import { TechThemeProvider } from "./TechThemeProvider";
import { getTechNavbarUser } from "../../lib/tech/fixitnowSession";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Dial a Tech layout — copied FixItNow public chrome (D-38).
 * Branch-scoped — not the shared DIAL storefront AppShell.
 */
export default async function TechLayout({ children }: { children: ReactNode }) {
  const user = await getTechNavbarUser();
  return (
    <TechThemeProvider>
      <div
        className={`fin-tech ${inter.variable} ${inter.className}`}
        data-donor="fixitnow"
        data-branch="tech"
      >
        <Navbar user={user} />
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster richColors closeButton expand />
      </div>
    </TechThemeProvider>
  );
}
